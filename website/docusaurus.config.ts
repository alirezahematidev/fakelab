import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Fakelab",
  tagline: "A fast, easy-config mock API server for frontend developers.",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://alirezahematidev.github.io",
  trailingSlash: false,
  baseUrl: "/fakelab/",
  organizationName: "alirezahematidev",
  projectName: "fakelab",

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/alirezahematidev/fakelab",
        },

        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/fakelab-og-image.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
      disableSwitch: true,
      defaultMode: "dark",
    },
    navbar: {
      title: "Fakelab",
      logo: {
        alt: "Fakelab Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/alirezahematidev/fakelab",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/intro",
            },
            {
              label: "Installation",
              to: "/docs/getting-started/installation",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/alirezahematidev/fakelab",
            },
            {
              label: "Issues",
              href: "https://github.com/alirezahematidev/fakelab/issues",
            },
          ],
        },
      ],
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
