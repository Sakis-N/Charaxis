/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ihmefvzmkmifunakpstz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Το image-optimization proxy του Netlify επέστρεφε τις φωτογραφίες
    // πολύ μικρότερες απ' όσο ζητούσαμε (θολή εμφάνιση). Οι φωτογραφίες
    // προϊόντων ετοιμάζονται ήδη στο σωστό μέγεθος πριν ανέβουν, οπότε
    // σερβίρονται ως έχουν, χωρίς έξτρα resize/transcode.
    unoptimized: true,
  },
};

export default nextConfig;
