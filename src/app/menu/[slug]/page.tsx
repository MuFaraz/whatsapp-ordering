import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMenu } from "@/components/menu/public-menu";
import { getPublicMenu } from "@/lib/data/menu";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (!menu) return { title: "Menu not available" };
  const { restaurant } = menu;
  return {
    title: `${restaurant.name} menu`,
    description:
      restaurant.description ?? `View the ${restaurant.name} menu and order on WhatsApp.`,
    robots: restaurant.is_demo ? { index: false } : undefined,
    openGraph: {
      title: `${restaurant.name} menu`,
      description: restaurant.description ?? undefined,
      images: restaurant.cover_url && !restaurant.cover_url.endsWith(".svg") ? [restaurant.cover_url] : undefined,
    },
  };
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug.toLowerCase());
  if (!menu) notFound();

  return (
    <PublicMenu
      restaurant={menu.restaurant}
      categories={menu.categories}
      items={menu.items}
    />
  );
}
