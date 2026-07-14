import { NextResponse } from "next/server";

const PROJECT_SOURCE =
  "https://osmo.b-cdn.net/resource-media/osmo-unicorn-refracted-glass-v2.json";
const LED_ASPECT_RATIO = 1920 / 1080;

type SceneLayer = {
  layerType: string;
  trackMouse?: number;
  mouseMomentum?: number;
};

type ImageLayer = SceneLayer & {
  layerType: "image";
  src: string;
  aspectRatio: number;
  width: number;
  height: number;
  imageNaturalSize: { _x: number; _y: number };
  compiledFragmentShaders: string[];
  data: {
    uniforms: {
      artboardResolution: { value: { _x: number; _y: number } };
      aspectRatio: { value: number };
    };
  };
};

type UnicornProject = {
  history: SceneLayer[];
  options: { name: string };
};

/**
 * Adapts the production Osmo scene to the local 16:9 LED artwork, disables
 * pointer tracking, and leaves the effect animation values untouched.
 */
export async function GET() {
  const response = await fetch(PROJECT_SOURCE, { cache: "force-cache" });

  if (!response.ok) {
    return NextResponse.json(
      { error: "background_project_unavailable" },
      { status: 502 },
    );
  }

  const project = (await response.json()) as UnicornProject;
  const imageLayer = project.history.find(
    (layer): layer is ImageLayer => layer.layerType === "image",
  );

  if (!imageLayer) {
    return NextResponse.json(
      { error: "background_image_layer_missing" },
      { status: 502 },
    );
  }
  for (const layer of project.history) {
    if ("trackMouse" in layer) layer.trackMouse = 0;
    if ("mouseMomentum" in layer) layer.mouseMomentum = 0;
  }


  imageLayer.src = "/led-bg.png";
  imageLayer.aspectRatio = LED_ASPECT_RATIO;
  imageLayer.width = 1920;
  imageLayer.height = 1080;
  imageLayer.imageNaturalSize._x = 1920;
  imageLayer.imageNaturalSize._y = 1080;
  imageLayer.compiledFragmentShaders = imageLayer.compiledFragmentShaders.map(
    (shader) => shader.replaceAll("vec2(800, 1200)", "vec2(1920, 1080)"),
  );
  imageLayer.data.uniforms.artboardResolution.value._x = 1920;
  imageLayer.data.uniforms.artboardResolution.value._y = 1080;
  imageLayer.data.uniforms.aspectRatio.value = LED_ASPECT_RATIO;
  project.options.name = "Love Revealed LED Background";

  return NextResponse.json(project, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
