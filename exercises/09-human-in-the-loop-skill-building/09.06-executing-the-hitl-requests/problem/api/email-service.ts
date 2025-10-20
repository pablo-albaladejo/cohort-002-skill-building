export const sendEmail = (opts: {
  to: string;
  subject: string;
  content: string;
}) => {
  const { to, subject, content } = opts;

  console.log(
    `Sending email to ${to} with subject ${subject} and body ${content}`,
  );
};
