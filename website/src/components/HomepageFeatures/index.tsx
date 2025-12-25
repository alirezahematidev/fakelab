import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "⚡ Instant Mock Server",
    description: <>Get your mock API server up and running in seconds. No complex setup, no configuration headaches. Just define your types and start developing.</>,
  },
  {
    title: "🗂️ Mock from TypeScript",
    description: <>Use your existing TypeScript interfaces and types directly. Annotate with Faker tags to control mock data generation with zero boilerplate.</>,
  },
  {
    title: "🗄️ Persistent Database",
    description: <>Built-in database mode with seeding support. Perfect for testing CRUD operations and maintaining state across development sessions.</>,
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
