import { Head } from '@inertiajs/react';
import ContactSection from './landing/components/ContactSection';
import HeroSection from './landing/components/HeroSection';
import NewsSection from './landing/components/NewsSection';
import ServicesSection from './landing/components/ServicesSection';
import VisionMissionSection from './landing/components/VisionMissionSection';
import Footer from './landing/components/Footer';
import Navbar from './landing/navbar';
import Pengumuman from './landing/pengumuman';

const Welcome = ({ geojsons, regions, user }: { geojsons: any; regions: any; user: any }) => {
    const geojsonData = Array.isArray(geojsons) ? geojsons : [];
    console.log('GeoJSON Data:', geojsonData);
    return (
        <>
            <Head title="Dinas PUPR Kabupaten Bintan">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#F7F7F7] dark:bg-[#121212]">
                <Pengumuman />
                <Navbar />
                <HeroSection />
                <VisionMissionSection />
                <ServicesSection />
                <NewsSection />
                <ContactSection />
                <Footer />
            </div>
        </>
    );
};

export default Welcome;
