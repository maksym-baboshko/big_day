import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SurfacePanel } from "./SurfacePanel";

const meta = {
  title: "Shared UI/SurfacePanel",
  component: SurfacePanel,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SurfacePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

function ExampleSurface({
  tone,
}: {
  tone: "default" | "subtle" | "highlighted";
}) {
  return (
    <div className="w-[min(40rem,92vw)] bg-bg-primary p-8">
      <SurfacePanel tone={tone} hoverable contentClassName="p-8">
        <p className="surface-panel-label">Canonical surface</p>
        <h3 className="heading-serif mt-4 text-3xl text-text-primary">
          {tone === "default" ? "Default" : tone === "subtle" ? "Subtle" : "Highlighted"} panel
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
          Use this as the shared invitation-first surface language instead of introducing another
          one-off card recipe.
        </p>
      </SurfacePanel>
    </div>
  );
}

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => <ExampleSurface tone="default" />,
};

export const Subtle: Story = {
  args: {
    children: null,
  },
  render: () => <ExampleSurface tone="subtle" />,
};

export const Highlighted: Story = {
  args: {
    children: null,
  },
  render: () => <ExampleSurface tone="highlighted" />,
};
