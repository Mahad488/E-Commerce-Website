import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Categories from "../components/Categories";
import FeaturedProducts from "../components/FeaturedProducts";
import PromoBanner from "../components/PromoBanner";
import Footer from "../components/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-white">

      <Navbar />

      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <PromoBanner />
      </main>

      <Footer />

    </div>
  );
}

export default Home;