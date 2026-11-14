const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}),
  });
  const fixtures = JSON.parse(fs.readFileSync("tests/fixtures.json"));
  const {commitments} = await import("../lib/volunteer-v3.mjs");
  fixtures.beginner.commitmentChecks = [...commitments];
  const errors = [];
  const results = [];
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    let submits = 0;
    let photoStatus = "missing";
    // Fail closed: only explicit mocks may reach the connected data service.
    await page.route("https://*.supabase.co/**", route => route.abort());
    await page.route("**/rest/v1/rpc/**", async (route) => {
      const name = route.request().url().split("/").pop();
      const response =
        name === "get_volunteer_form_config"
          ? {
              version: 6,
              form_config: { application_model: "enhanced_v3" },
              is_open: true,
            }
          : name === "get_volunteer_resume_state"
            ? { id: "test-id", status: "draft", photo_status: photoStatus }
            : name === "submit_volunteer_application"
              ? (submits++,
                {
                  id: "test-id",
                  status: "submitted",
                  submitted_at: new Date().toISOString(),
                })
              : { id: "test-id", status: "draft" };
      await route.fulfill({ json: response });
    });
    await page.route("**/functions/v1/volunteer-photo-preview", (r) =>
      r.fulfill({ json: {} }),
    );
    await page.addInitScript((d) => {
      if (localStorage.getItem("ai-lab-volunteer-draft-v3")) return;
      localStorage.setItem(
        "ai-lab-volunteer-draft-v3",
        JSON.stringify({ data: d, step: 0 }),
      );
      localStorage.setItem("ai-lab-volunteer-id", "test-id");
      localStorage.setItem("ai-lab-volunteer-token", "test-token");
    }, fixtures.beginner);
    await page.goto((process.env.TEST_BASE_URL || "http://localhost:3000") + "/volunteer/apply");
    await page
      .getByRole("heading", { name: "Tell us about you", exact: true })
      .waitFor();
    await page.locator("#v3-postcode").fill("012345");
    await page.locator("#v3-postcode").blur();
    await page.locator("#v3-postcode").evaluate(el => { if (el.value !== "012345") throw Error("Invalid PIN was not retained"); });
    await page.getByRole("button", { name: "Continue →" }).click();
    await page.locator("#v3-errors").waitFor();
    await page.locator("#v3-postcode").fill("400001");
    await page.locator("#v3-postcode").blur();
    for (let s = 0; s < 4; s++) {
      if (s === 3) {
        await page
          .getByRole("checkbox", {
            name: commitments[0], exact: true,
          })
          .uncheck();
        await page.getByRole("button", { name: "Continue →" }).click();
        await page.locator("#v3-errors").waitFor();
        await page
          .getByRole("checkbox", {
            name: commitments[0], exact: true,
          })
          .check();
        await page.screenshot({
          path: `test-results/commitments-${width}.png`,
          fullPage: true,
        });
      }
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error(`Horizontal overflow at ${width} step ${s}`);
      await page.getByRole("button", { name: "Continue →" }).click();
      await page
        .getByRole("heading", {
          name: [
            "Profile & skills",
            "Experience & work",
            "Background & commitments",
            "Review & submit",
          ][s],
          exact: true,
        })
        .waitFor();
    }
    await page.screenshot({
      path: `test-results/review-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", {name:"Submit application",exact:true}).click();
    await page.locator("#v3-photo-error").waitFor();
    if (!(await page.getByRole("heading", {name:"Review & submit",exact:true}).isVisible())) throw Error("Photo error left review");
    if (submits !== 0) throw Error("Submitted without photo");
    // Simulate a previously uploaded photo via mocked resume API; no upload occurs.
    photoStatus = "review";
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("ai-lab-volunteer-draft-v3") || "{}").step === 4);
    await page.reload();
    await page.getByRole("heading", {name:"Review & submit",exact:true}).waitFor();
    const personal = page.locator("details.v3-review").first();
    await personal.locator("summary").click();
    await page.getByRole("button",{name:"Edit Tell us about you",exact:true}).click();
    if (await page.locator("#v3-postcode").inputValue() !== "400001") throw Error("Review edit lost saved answer");
    for (let step=0;step<4;step++) await page.getByRole("button",{name:"Continue →",exact:true}).click();
    if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error(`Review overflow at ${width}`);

    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page.getByRole("heading", { name: "Application received" }).waitFor();
    if (submits !== 1) throw Error("Submission count " + submits);
    results.push({ width, completed: true, submits });
    console.log(JSON.stringify(results.at(-1)));
    await page.close();
  }
  await browser.close();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(JSON.stringify(results));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
