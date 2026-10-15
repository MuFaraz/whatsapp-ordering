import { DEMO_SLUG } from "@/config/site";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/database";

/*
 * Built-in sample restaurant used by the public demo menu and the demo
 * dashboard. It is fictional, lives in code (no database needed) and can
 * therefore never be modified by visitors or interfere with customer data.
 * Illustrations are original SVGs in /public/images/demo.
 */

const DEMO_RESTAURANT_ID = "00000000-0000-4000-8000-00000000d3e0";
const STAMP = "2026-10-01T09:00:00.000Z";

export const demoRestaurant: Restaurant = {
  id: DEMO_RESTAURANT_ID,
  owner_id: null,
  name: "Bun & Brew Café",
  slug: DEMO_SLUG,
  description:
    "Smash burgers, crispy sides and proper coffee. A fictional café created to demonstrate Bun & Brew Menu.",
  logo_url: "/images/demo/logo.svg",
  cover_url: "/images/demo/cover.svg",
  // Fictional number (555-01xx is reserved for fiction). Demo orders never use
  // it: they go to NEXT_PUBLIC_DEMO_WHATSAPP_NUMBER, or to the WhatsApp chat
  // picker when that isn't set (see getDemoMenu).
  whatsapp_number: "+12025550123",
  contact_phone: null,
  contact_email: null,
  address: "Sample address: this restaurant does not exist",
  currency: "PKR",
  is_published: true,
  is_demo: true,
  accepts_dine_in: true,
  accepts_takeaway: true,
  accepts_delivery: true,
  table_number_enabled: true,
  created_at: STAMP,
  updated_at: STAMP,
};

type CategorySeed = { key: string; name: string; description: string };

const categorySeeds: CategorySeed[] = [
  {
    key: "burgers",
    name: "Smash Burgers",
    description: "Fresh beef smashed on a hot griddle, served on toasted brioche.",
  },
  {
    key: "sides",
    name: "Sides",
    description: "Perfect for sharing.",
  },
  {
    key: "coffee",
    name: "Coffee & Chai",
    description: "Locally roasted beans, brewed to order.",
  },
  {
    key: "shakes",
    name: "Shakes & Coolers",
    description: "Thick shakes and refreshing coolers.",
  },
  {
    key: "desserts",
    name: "Desserts",
    description: "Something sweet to finish.",
  },
];

const catId = (index: number) =>
  `00000000-0000-4000-8000-0000000c${String(index).padStart(4, "0")}`;
const itemId = (index: number) =>
  `00000000-0000-4000-8000-000000${String(index).padStart(6, "0")}`;

export const demoCategories: MenuCategory[] = categorySeeds.map((c, i) => ({
  id: catId(i + 1),
  restaurant_id: DEMO_RESTAURANT_ID,
  name: c.name,
  description: c.description,
  sort_order: i,
  created_at: STAMP,
  updated_at: STAMP,
}));

const categoryIdByKey = Object.fromEntries(
  categorySeeds.map((c, i) => [c.key, catId(i + 1)]),
);

type ItemSeed = {
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available?: boolean;
};

const itemSeeds: ItemSeed[] = [
  {
    category: "burgers",
    name: "Classic Smash",
    description:
      "Single smashed beef patty, American cheese, pickles, onions and our house sauce.",
    price: 950,
    image: "burger",
  },
  {
    category: "burgers",
    name: "Double Trouble",
    description:
      "Two smashed patties, double cheese, caramelised onions and smoky mayo.",
    price: 1350,
    image: "burger-double",
  },
  {
    category: "burgers",
    name: "Crispy Chicken Burger",
    description:
      "Buttermilk fried chicken thigh, purple slaw, lettuce and spicy mayo.",
    price: 890,
    image: "burger-chicken",
  },
  {
    category: "burgers",
    name: "Mushroom Swiss Melt",
    description:
      "Smashed patty, sautéed mushrooms, Swiss cheese and garlic aioli.",
    price: 1150,
    image: "burger-double",
    available: false,
  },
  {
    category: "sides",
    name: "Skin-on Fries",
    description: "Crispy hand-cut fries with sea salt.",
    price: 390,
    image: "fries",
  },
  {
    category: "sides",
    name: "Loaded Cheese Fries",
    description: "Fries topped with cheese sauce, jalapeños and spring onion.",
    price: 650,
    image: "fries-loaded",
  },
  {
    category: "sides",
    name: "Hot Honey Wings (6 pcs)",
    description: "Crispy wings tossed in chilli-infused honey and sesame.",
    price: 790,
    image: "wings",
  },
  {
    category: "sides",
    name: "Onion Rings",
    description: "Beer-batter style onion rings (alcohol-free) with ranch dip.",
    price: 450,
    image: "onion-rings",
  },
  {
    category: "coffee",
    name: "Espresso",
    description: "A double shot of our house blend.",
    price: 350,
    image: "espresso",
  },
  {
    category: "coffee",
    name: "Spanish Latte",
    description: "Espresso with steamed milk and a touch of condensed milk.",
    price: 650,
    image: "latte",
  },
  {
    category: "coffee",
    name: "Caramel Iced Coffee",
    description: "Cold espresso, milk, caramel and plenty of ice.",
    price: 690,
    image: "iced-coffee",
  },
  {
    category: "coffee",
    name: "Karak Chai",
    description: "Strong black tea slow-brewed with milk, cardamom and sugar.",
    price: 250,
    image: "chai",
  },
  {
    category: "shakes",
    name: "Biscoff Shake",
    description: "Vanilla ice cream blended with caramelised biscuit spread.",
    price: 850,
    image: "shake",
  },
  {
    category: "shakes",
    name: "Classic Vanilla Shake",
    description: "Thick, creamy and topped with whipped cream.",
    price: 650,
    image: "shake",
  },
  {
    category: "shakes",
    name: "Mint Lemonade",
    description: "Fresh lemon, mint and crushed ice.",
    price: 390,
    image: "lemonade",
  },
  {
    category: "desserts",
    name: "Molten Brownie",
    description: "Warm fudge brownie with a scoop of vanilla ice cream.",
    price: 590,
    image: "brownie",
  },
  {
    category: "desserts",
    name: "Mango Cheesecake",
    description: "Seasonal baked cheesecake with fresh mango topping.",
    price: 750,
    image: "cheesecake",
    available: false,
  },
  {
    category: "desserts",
    name: "Chocolate Chip Cookie",
    description: "Chewy, gooey and baked fresh every morning.",
    price: 290,
    image: "cookie",
  },
];

export const demoItems: MenuItem[] = itemSeeds.map((item, i) => ({
  id: itemId(i + 1),
  restaurant_id: DEMO_RESTAURANT_ID,
  category_id: categoryIdByKey[item.category]!,
  name: item.name,
  description: item.description,
  price: item.price,
  image_url: `/images/demo/${item.image}.svg`,
  is_available: item.available ?? true,
  sort_order: i,
  created_at: STAMP,
  updated_at: STAMP,
}));

export function isDemoSlug(slug: string): boolean {
  return slug === DEMO_SLUG;
}
