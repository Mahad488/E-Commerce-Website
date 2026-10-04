import {
  Shirt,
  Smartphone,
  Watch,
  ShoppingBag,
} from "lucide-react";

const categories = [
  {
    name: "Fashion",
    icon: Shirt,
    color: "bg-pink-100",
  },
  {
    name: "Electronics",
    icon: Smartphone,
    color: "bg-blue-100",
  },
  {
    name: "Accessories",
    icon: Watch,
    color: "bg-yellow-100",
  },
  {
    name: "Lifestyle",
    icon: ShoppingBag,
    color: "bg-green-100",
  },
];

function Categories() {
  return (
    <section id="categories" className="py-20">

      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        <div className="text-center mb-12">
          <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
            Explore
          </span>

          <h2 className="text-3xl md:text-4xl font-bold mt-3">
            Shop By Category
          </h2>

          <p className="text-gray-500 mt-3">
            Find everything you need in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <a
                href="#products"
                key={category.name}
                className="group border border-gray-100 rounded-2xl p-8 flex flex-col items-center hover:shadow-lg hover:-translate-y-1 transition duration-300"
              >

                <div className={`${category.color} w-20 h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition`}>
                  <Icon size={32} strokeWidth={1.5} />
                </div>

                <h3 className="font-semibold mt-5">
                  {category.name}
                </h3>

                <p className="text-xs text-gray-500 mt-2">
                  Explore Collection
                </p>

              </a>
            );
          })}

        </div>
      </div>
    </section>
  );
}

export default Categories;