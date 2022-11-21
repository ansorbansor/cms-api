import { registerAs } from '@nestjs/config';

export default registerAs('pionir', () => ({
  url: process.env.PIONIR_URL,
  tokenUrl: `${process.env.PIONIR_URL}/Auth/ajax_csrf`,
  postCourseUrl: `${process.env.PIONIR_URL}/report/SubmitPelatihanPlaybook`,
}));
