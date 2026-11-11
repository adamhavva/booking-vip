// Indonesian counterparts of the static content in `home.ts` / `services.ts`.
//
// The seed writes these into the `*Id` columns so the database holds both
// languages of every piece of copy. The keys match the slugs used by the
// English source data.

/** Promo cards — slug → { title, subtitle }. */
export const promoCopyId: Record<string, { title: string; subtitle: string }> = {
  "vip-welcome-offer": {
    title: "Penawaran Selamat Datang VIP",
    subtitle: "Diskon 20% untuk Meet & Greet pertama Anda",
  },
  "transfer-bundle": {
    title: "Paket Transfer",
    subtitle: "Hemat saat Anda menambahkan transfer pribadi",
  },
  "tour-early-bird": {
    title: "Tour Early Bird",
    subtitle: "Pesan 30 hari lebih awal dan hemat lebih banyak",
  },
  "evoa-express-deal": {
    title: "Promo eVOA Express",
    subtitle: "Pemprioritasan dengan tarif khusus",
  },
  "family-vip-cashback": {
    title: "Cashback VIP Keluarga",
    subtitle: "Cashback ekstra untuk paket keluarga",
  },
};

/** Travel guides — slug → { title, category }. */
export const articleCopyId: Record<string, { title: string; category: string }> = {
  "what-to-expect-from-an-airport-meet-greet": {
    title: "Apa yang Diharapkan dari Meet & Greet Bandara",
    category: "Perjalanan VIP",
  },
  "a-guide-to-indonesia-s-evoa-for-first-timers": {
    title: "Panduan eVOA Indonesia untuk Pemula",
    category: "Visa & Kezagetan",
  },
  "choosing-the-right-private-transfer": {
    title: "Memilih Transfer Pribadi yang Tepat",
    category: "Transportasi",
  },
  "five-tours-worth-taking-this-year": {
    title: "Lima Tour yang Layak Dijalankan Tahun Ini",
    category: "Paket Wisata",
  },
  "fast-track-vs-standard-immigration": {
    title: "Fast Track vs. Imigrasi Biasa",
    category: "Perjalanan VIP",
  },
};

/** Destination tiles — slug → { name, country }. */
export const destinationCopyId: Record<string, { name: string; country: string }> = {
  bali: { name: "Bali", country: "Indonesia" },
  "labuan-bajo": { name: "Labuan Bajo", country: "Indonesia" },
  yogyakarta: { name: "Yogyakarta", country: "Indonesia" },
  lombok: { name: "Lombok", country: "Indonesia" },
  "raja-ampat": { name: "Raja Ampat", country: "Indonesia" },
  bromo: { name: "Bromo", country: "Indonesia" },
  jakarta: { name: "Jakarta", country: "Indonesia" },
  bandung: { name: "Bandung", country: "Indonesia" },
};

/** Service page copy — line slug → { intro, sections, highlights, tabs }. */
export const servicePageCopyId: Record<
  string,
  {
    intro: string;
    sections: { heading: string; body: string }[];
    highlights: string[];
    tabs: string[];
  }
> = {
  "vip-service": {
    intro:
      "Lewati antrean panjang di bandara. Pramutama kami menjemput Anda di pintu kedatangan, mempercepat imigrasi, dan mengantar Anda langsung ke terminal atau lounge privat.",
    sections: [
      {
        heading: "Apa yang Anda dapatkan",
        body: "Meet & Greet di pintu pesawat, jalur prioritas imigrasi dan keamanan, serta pramutama khusus yang menemani Anda hingga mencapai gate.",
      },
      {
        heading: "Area operasional kami",
        body: "Soekarno-Hatta, Juanda, Ngurah Rai, Kualanamu, Polonia, serta bandara regional terpilih di seluruh Indonesia.",
      },
      {
        heading: "Cara memesan",
        body: "Pilih bandara, jenis layanan, tanggal, dan jumlah penumpang di kolom pencarian di atas. Konfirmasi langsung dikirim ke email Anda.",
      },
    ],
    highlights: ["Meet & Greet", "Fast Track", "Airport Lounge", "Porter & Bagasi"],
    tabs: ["Semua", "Meet & Greet", "Fast Track", "Lounge", "Porter"],
  },

  transport: {
    intro:
      "Transfer pribadi, layanan sopir, danjemputan airport dengan tarif tetap serta driver profesional. Travel dari airport ke hotel tanpa tawar-menawar.",
    sections: [
      {
        heading: "Armada kami",
        body: "Pilihan sedan, SUV, van, dan limousine untuk traveler sendiri, keluarga, dan grup. Setiap kendaraan sudah termasuk driver, bahan bakar, dan tol.",
      },
      {
        heading: "Harga tetap, tanpa kejutan",
        body: "Harga yang Anda lihat adalah harga yang Anda bayar. Pelacakan penerbangan sudah termasuk, sehingga driver Anda menunggu bila penerbangan terlambat.",
      },
      {
        heading: "Rute populer",
        body: "Airport ke hotel, hotel ke restoran, antar kota, serta sewa harian dengan skema per jam atau per hari.",
      },
    ],
    highlights: ["Sedan", "SUV", "Van", "Limousine"],
    tabs: ["Semua", "Sedan", "SUV", "Van", "Limousine"],
  },

  "tour-package": {
    intro:
      "Tour pilihan di seluruh Indonesia dengan pemandu pribadi, tiket masuk, dan transport yang sudah diatur — dari akhir pekan di Bali hingga perjalanan несколько hari ke Labuan Bajo.",
    sections: [
      {
        heading: "Pribadi dan kelompok kecil",
        body: "Setiap tour dapat diambil secara pribadi atau dibagikan dengan kelompok kecil hingga delapan traveler. Itinerary khusus tersedia atas permintaan.",
      },
      {
        heading: "Yang sudah termasuk",
        body: "Penjemputan hotel, pemandu pribadi, tiket masuk, dan makan siang di tempat terbaik sudah dipaketkan dalam satu harga transparan.",
      },
      {
        heading: "Destinasi",
        body: "Bali, Lombok, Yogyakarta, Labuan Bajo, Komodo, Raja Ampat, dan Papua. Itinerary beberapa hari mencakup titik terbaik tanpa terburu-buru.",
      },
    ],
    highlights: ["Bali", "Lombok", "Yogyakarta", "Labuan Bajo", "Papua"],
    tabs: ["Semua", "Bali", "Labuan Bajo", "Yogyakarta", "Lombok", "Papua"],
  },

  evoa: {
    intro:
      "Ajukan visa Indonesia secara online dalam hitungan menit. Tanpa perlu ke kedutaan, tanpa dokumen fisik — terima eVOA lewat email dan tunjukkan QR code di imigrasi.",
    sections: [
      {
        heading: "Siapa yang dapat mendaftar",
        body: "Turis dan pelaku bisnis dari negara yang memenuhi syarat, tinggal hingga 60 hari. Tersedia pilihan masuk tunggal dan banyak kali.",
      },
      {
        heading: "Cara kerjanya",
        body: "Isi formulir online, unggah foto paspor, dan lakukan pembayaran. Sebagian besar pengajuan ditinjau dan disetujui dalam satu hari kerja.",
      },
      {
        heading: "Saat tiba",
        body: "Cetak atau simpan eVOA di ponsel Anda, lalu langsung menuju loket imigrasi untuk masuk dengan lancar.",
      },
    ],
    highlights: ["Touris", "Bisnis", "Express", "Transit"],
    tabs: ["Semua", "Touris", "Bisnis", "Express", "Transit"],
  },
};

/** SEO blocks — slug → { title, sections }. */
export const seoBlockCopyId: Record<
  string,
  { title: string; sections: { heading: string; body: string }[] }
> = {
  "travel-like-a-vip-from-arrival-to-departure": {
    title: "Travel Seperti VIP, Dari Kedatangan hingga Keberangkatan",
    sections: [
      {
        heading: "Pengalaman Bandara yang Mulus",
        body: "Biarkan tim kami menangani antrean, administrasi, dan bagasi agar Anda dapat melewati bandara dengan tenang.",
      },
      {
        heading: "Transport Pribadi, Tepat Waktu",
        body: "Sopir profesional dan kendaraan yang terawat dengan baik mengantar Anda ke tujuan dengan nyaman dan tepat waktu.",
      },
      {
        heading: "Paket Tour Kurasi",
        body: "Jelajahi destinasi terbaik Indonesia dengan itinerary yang dirancang untuk kenyamanan, penemuan, dan nilai terbaik.",
      },
    ],
  },
  "simple-evoa-stress-free-entry": {
    title: "eVOA Sederhana, Masuk Tanpa Stres",
    sections: [
      {
        heading: "Ajukan Online dalam Menit",
        body: "Kirim data dan dokumen dari mana saja — tanpa perlu datang ke kedutaan.",
      },
      {
        heading: "Pemrosesan Cepat",
        body: "Pilih pemrosesan standar atau express dan terima eVOA lewat email, siap ditunjukkan saat tiba.",
      },
      {
        heading: "Dukungan 24/7",
        body: "Tim concierge kami siap membantu setiap langkah perjalanan Anda, kapan pun Anda butuh.",
      },
    ],
  },
};

/** SEO link labels — slug → label. */
export const seoLinkCopyId: Record<string, string> = {
  "meet-greet-at-soekarno-hatta": "Meet & Greet di Soekarno-Hatta",
  "fast-track-at-ngurah-rai-bali": "Fast Track di Ngurah Rai Bali",
  "premium-lounge-jakarta": "Premium Lounge Jakarta",
  "family-vip-package": "Paket VIP Keluarga",
  "private-transfer-in-bali": "Transfer Pribadi di Bali",
  "airport-transfer-jakarta": "Transfer Airport Jakarta",
  "chauffeur-service-surabaya": "Layanan Sopir Surabaya",
  "hourly-car-hire": "Sewa Mobil per Jam",
  "bali-highlights-tour": "Tour Highlights Bali",
  "komodo-sailing-trip": "Perjalanan Kapal Komodo",
  "yogyakarta-heritage-tour": "Tour Heritage Yogyakarta",
  "tourist-evoa-indonesia": "eVOA Tourist Indonesia",
  "airport-vip-service-jakarta": "Layanan VIP Bandara Jakarta",
  "airport-vip-service-bali": "Layanan VIP Bandara Bali",
  "airport-vip-service-surabaya": "Layanan VIP Bandara Surabaya",
  "airport-vip-service-medan": "Layanan VIP Bandara Medan",
  "private-transport-bali": "Transportasi Pribadi Bali",
  "private-transport-jakarta": "Transportasi Pribadi Jakarta",
  "group-van-transfer": "Transfer Van Grup",
  "luxury-limousine-service": "Layanan Limousine Mewah",
  "tour-package-bali": "Paket Tour Bali",
  "tour-package-lombok": "Paket Tour Lombok",
  "tour-package-labuan-bajo": "Paket Tour Labuan Bajo",
  "tour-package-yogyakarta": "Paket Tour Yogyakarta",
  "evoa-indonesia-30-days": "eVOA Indonesia 30 Hari",
  "business-evoa": "eVOA Bisnis",
  "express-evoa": "eVOA Express",
  "transit-evoa": "eVOA Transit",
};

/** Search field labels — "lineSlug:key" → { label, placeholder }. */
export const searchFieldCopyId: Record<
  string,
  { label: string; placeholder: string }
> = {
  "vip-service:airport": {
    label: "Bandara",
    placeholder: "Pilih bandara",
  },
  "vip-service:type": {
    label: "Jenis Layanan",
    placeholder: "Pilih jenis layanan",
  },
  "vip-service:date": {
    label: "Tanggal & Waktu",
    placeholder: "Pilih tanggal & waktu",
  },
  "vip-service:pax": {
    label: "Penumpang",
    placeholder: "Pilih penumpang",
  },
  "transport:pickup": {
    label: "Titik Keberangkatan",
    placeholder: "Pilih kota keberangkatan",
  },
  "transport:dropoff": {
    label: "Tujuan",
    placeholder: "Pilih kota tujuan",
  },
  "transport:datetime": {
    label: "Tanggal & Waktu",
    placeholder: "Pilih tanggal & waktu",
  },
  "transport:pax": {
    label: "Penumpang",
    placeholder: "Pilih penumpang",
  },
  "tour-package:destination": {
    label: "Destinasi",
    placeholder: "Pilih destinasi",
  },
  "tour-package:startDate": {
    label: "Tanggal Mulai",
    placeholder: "Pilih tanggal & waktu",
  },
  "tour-package:travelers": {
    label: "Traveler",
    placeholder: "Pilih traveler",
  },
  "evoa:nationality": {
    label: "Kewarganegaraan",
    placeholder: "Pilih negara Anda",
  },
  "evoa:destination": {
    label: "Destinasi",
    placeholder: "Pilih destinasi",
  },
  "evoa:arrivalDate": {
    label: "Tanggal & Waktu Kedatangan",
    placeholder: "Pilih tanggal & waktu",
  },
};
