'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {attendeeDefaultValues,attendeeSchema} from '../../lib/forms/attendee-schema';
export default function RegistrationFormProbe(){
  const {register}=useForm({resolver:zodResolver(attendeeSchema),defaultValues:attendeeDefaultValues});
  return <main style={{padding:24}}><form><label>Build probe<input {...register('full_name')}/></label></form></main>;
}
