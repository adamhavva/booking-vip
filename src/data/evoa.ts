/**
 * The e-VOA service copy.
 *
 * The "how it works" steps are seeded into the `Setting` table
 * (`evoa.howItWorks`) so they can be edited without a deploy. This file is
 * the source of that seed data.
 */

export type EvoaStep = {
  title: string;
  body: string;
};

export const evoaHowItWorks: { en: EvoaStep[]; id: EvoaStep[] } = {
  en: [
    {
      title: "Send the passport data",
      body: "Fill in the passport details of the traveller. Our team checks the data against the official requirements.",
    },
    {
      title: "We handle the application",
      body: "We submit the e-VOA application on the official portal and follow up until it is issued.",
    },
    {
      title: "Receive the visa",
      body: "The approved e-VOA is sent to your email — keep the QR code ready for the immigration counter.",
    },
  ],
  id: [
    {
      title: "Kirim data paspor",
      body: "Isi data paspor orang yang akanKenna visa. Tim kami memeriksa kesesuaiannya dengan syarat resmi.",
    },
    {
      title: "Kami tangani pengajuannya",
      body: "Kami mengirim pengajuan e-VOA ke portal resmi dan memantau sampai selesai.",
    },
    {
      title: "Visa dikirim ke kamu",
      body: "e-VOA yang disetujui dikirim ke email kamu — simpan QR code-nya untuk diMeja imigrasi.",
    },
  ],
};
