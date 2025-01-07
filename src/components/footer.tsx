import { footerConfig } from "@/lib/footer-config";
import Image from "next/image";

interface FooterLinkProps {
  label: string;
  url: string;
}

const FooterLink = ({ label, url }: FooterLinkProps) => (
  <li>
    <a
      href={url}
      target={
        url.startsWith("http") || url.startsWith("mailto")
          ? "_blank"
          : undefined
      }
      rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
    >
      {label}
    </a>
  </li>
);

const FooterSection = ({
  title,
  links,
}: {
  title: string;
  links: readonly FooterLinkProps[];
}) => (
  <div className="text-center">
    <h3 className="font-semibold mb-4">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <FooterLink key={link.label} {...link} />
      ))}
    </ul>
  </div>
);

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-1 text-center">
            <div className="flex flex-col gap-4 items-center justify-center space-x-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo-light.svg"
                  alt="LiquidLeap"
                  className="hidden dark:block"
                  width={300}
                  height={300}
                //   priority
                />
                <Image
                  src="/logo-dark.svg"
                  alt="LiquidLeap"
                  className="block dark:hidden"
                  width={300}
                  height={300}
                //   priority
                />
              </div>
              <span className="font-bold text-3xl">LiquidLeap</span>
            </div>
          </div>

          {/* Dynamic Sections */}
          {Object.entries(footerConfig.sections).map(([key, section]) => (
            <FooterSection
              key={key}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}
