import { FRAMEWORKS } from "@/lib/snippets";
import { highlight } from "@/lib/highlight";
import { CodeTabs, type RenderedFramework } from "./CodeTabs";

export async function CodeShowcase() {
  const rendered: RenderedFramework[] = await Promise.all(
    FRAMEWORKS.map(async (f) => ({
      id: f.id,
      name: f.name,
      files: await Promise.all(
        f.files.map(async (s) => ({ file: s.file, html: await highlight(s.code, s.lang) })),
      ),
    })),
  );
  return <CodeTabs frameworks={rendered} />;
}
