import { FamilyMix } from "@/components/family/family-mix";

/**
 * The Family Love Mix at a shareable URL. `params` is a Promise in the App
 * Router — await it, then hand the code to the client mix screen which fetches
 * and polls the live mix.
 */
export default async function FamilyMixPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <FamilyMix code={code} />;
}
