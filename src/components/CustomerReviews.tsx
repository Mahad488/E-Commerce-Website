import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Quote, Star } from "lucide-react";

import { API_BASE_URL } from "../config/api";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";

interface FeaturedReview {
  id: number;
  name: string;
  rating: number;
  comment: string;
  productId: number;
  productName: string;
  productImage: string;
  category: string;
}

/** Latest 4–5★ reviews pulled live from the reviews table. Hidden when there are none. */
export default function CustomerReviews() {
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/reviews/featured`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => active && Array.isArray(data?.reviews) && setReviews(data.reviews.slice(0, 3)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 lg:py-24 bg-white scroll-reveal">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-orange-500 text-sm font-bold uppercase tracking-widest">Reviews</p>
          <h2 className="text-3xl md:text-4xl font-black mt-2">What shoppers are saying</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <figure
              key={review.id}
              className="relative bg-[#faf9f6] border border-gray-100 rounded-3xl p-7 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <Quote size={36} className="text-orange-200 absolute top-6 right-6" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className={s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                ))}
              </div>
              <blockquote className="text-gray-700 mt-4 leading-relaxed flex-1">“{review.comment}”</blockquote>
              <figcaption className="mt-6 flex items-center justify-between gap-3">
                <span className="font-bold text-sm">{review.name}</span>
                <Link
                  to={`/products/${review.productId}`}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-orange-600 min-w-0"
                >
                  <img
                    src={getImageUrl(review.productImage, review.category)}
                    onError={imageFallbackHandler(review.category)}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <span className="truncate">{review.productName}</span>
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
