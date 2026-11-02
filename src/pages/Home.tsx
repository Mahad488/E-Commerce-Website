import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import TrustBar from "../components/TrustBar";
import Categories from "../components/Categories";
import FlashSale from "../components/FlashSale";
import FeaturedProducts from "../components/FeaturedProducts";
import CustomerReviews from "../components/CustomerReviews";
import PromoBanner from "../components/PromoBanner";
import RecentlyViewed from "../components/RecentlyViewed";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <Hero />
        <TrustBar />
        <Categories />
        <FlashSale />
        <FeaturedProducts />
        <CustomerReviews />
        <PromoBanner />
        <RecentlyViewed title="Pick up where you left off" />
      </main>

      <Footer />
    </div>
  );
}

export default Home;
