import { Montserrat } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Navbar from "@/components/Navbar";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata = {
  title: "HUNTIQUE – Antique Furniture, Tableware & Transaction Archive",
  description: "Historical transactions archive, sales price map, and marketplace with offers and buy requests for antiques in the Czech Republic.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={montserrat.className}>
      <body className={montserrat.className}>
        <Navbar />
        <div
          role="note"
          style={{
            background: "#18181b",
            color: "#f4f4f5",
            fontSize: 12,
            lineHeight: 1.5,
            padding: "6px 16px",
            textAlign: "center",
          }}
        >
          Student prototype (university Competitive Intelligence project). Archive and map use public data from Livebid.cz
          and Aukro.cz with approximate locations. Listings marked &quot;Demo&quot; are illustrative examples. Do not enter personal data.
        </div>
        {children}
      </body>
    </html>
  );
}
