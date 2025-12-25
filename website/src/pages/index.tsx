import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" href="https://github.com/alirezahematidev/fakelab">
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      wrapperClassName="layout--wrapper"
      title={`${siteConfig.title} - ${siteConfig.tagline}`}
      description="A fast, easy-config mock API server for frontend developers. Generate realistic mock data from TypeScript interfaces with Faker annotations."
    >
      <HomepageHeader />
      <main className={styles["homepage--main"]}>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
