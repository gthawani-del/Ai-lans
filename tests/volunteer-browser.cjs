const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  fs.mkdirSync("test-results", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  });
  const fixtures = JSON.parse(fs.readFileSync("tests/fixtures.json"));
  const errors = [];
  const results = [];
  for (const width of [375, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    let submits = 0;
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
            ? { id: "test-id", status: "draft", photo_status: "review" }
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
      localStorage.setItem(
        "ai-lab-volunteer-draft-v3",
        JSON.stringify({ data: d, step: 0 }),
      );
      localStorage.setItem("ai-lab-volunteer-id", "test-id");
      localStorage.setItem("ai-lab-volunteer-token", "test-token");
    }, fixtures.beginner);
    await page.goto("http://localhost:3000/volunteer/apply");
    await page
      .getByRole("heading", { name: "Tell us about you", exact: true })
      .waitFor();
    await page.getByLabel("PIN code *", { exact: true }).fill("012345");
    await page.getByRole("button", { name: "Continue →" }).click();
    await page.locator("#v3-errors").waitFor();
    await page.getByLabel("PIN code *", { exact: true }).fill("400001");
    for (let s = 0; s < 4; s++) {
      if (s === 3) {
        await page
          .getByRole("checkbox", {
            name: "I have read and agree to all the commitments above.",
          })
          .uncheck();
        await page.getByRole("button", { name: "Continue →" }).click();
        await page.locator("#v3-errors").waitFor();
        await page
          .getByRole("checkbox", {
            name: "I have read and agree to all the commitments above.",
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
    await page
      .getByRole("button", { name: "Submit application", exact: true })
      .click();
    await page.getByRole("heading", { name: "Application received" }).waitFor();
    if (submits !== 1) throw Error("Submission count " + submits);
    results.push({ width, completed: true, submits });
    await page.close();
  }
  await browser.close();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(JSON.stringify(results));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
