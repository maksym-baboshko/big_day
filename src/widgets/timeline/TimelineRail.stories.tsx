import { StorybookFullscreenCanvas } from "@/testing/storybook/canvas";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TimelineRail, type TimelineRailEvent } from "./TimelineRail";

const TIMELINE_EVENTS: TimelineRailEvent[] = [
  {
    id: "ceremony",
    time: "15:30",
    title: "Весільна церемонія",
    description: "Момент, з якого офіційно почнеться наше свято і нова глава разом.",
  },
  {
    id: "photo_session",
    time: "16:30",
    title: "Перерва та фотосесія",
    description: "Час на теплі обійми, привітання і спільні фотографії з гостями.",
  },
  {
    id: "banquet",
    time: "17:30",
    title: "Святковий банкет",
    description: "Вечеря, тости і перші великі моменти вечора в колі найближчих.",
  },
  {
    id: "activities",
    time: "19:00",
    title: "Ігри та розваги",
    description: "Легка, жива програма для гостей з інтерактивами та веселими активностями.",
  },
  {
    id: "cake",
    time: "21:00",
    title: "Весільний торт",
    description: "Солодкий акцент вечора і ще один красивий спільний спогад.",
  },
  {
    id: "sparklers",
    time: "22:00",
    title: "Бенгальські вогні",
    description: "Фінальний теплий штрих дня з атмосферою світла і святкової магії.",
  },
];

const meta = {
  title: "Widgets/TimelineRail",
  component: TimelineRail,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof TimelineRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    events: TIMELINE_EVENTS,
  },
  globals: {
    motion: "reduce",
  },
  render: (args) => (
    <StorybookFullscreenCanvas className="px-4 py-16">
      <TimelineRail {...args} />
    </StorybookFullscreenCanvas>
  ),
};
