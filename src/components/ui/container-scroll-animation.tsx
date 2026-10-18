import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => (isMobile ? [0.88, 0.98] : [0.95, 1]);
  const rotate = useTransform(scrollYProgress, [0, 0.75], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.75], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.75], [0, -25]);

  return (
    <div
      className="min-h-[135vh] md:min-h-[155vh] flex items-center justify-center relative p-2 md:p-8 overflow-hidden"
      ref={containerRef}
    >
      <div
        className="py-6 md:py-16 w-full relative"
        style={{ perspective: "1000px" }}
      >
        <Header titleComponent={titleComponent} translate={translate} />
        <Card rotate={rotate} scale={scale} translate={translate}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => (
  <motion.div
    style={{ translateY: translate }}
    className="max-w-5xl mx-auto text-center mb-6 z-20"
  >
    {titleComponent}
  </motion.div>
);

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate?: MotionValue<number>;
  children: React.ReactNode;
}) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      boxShadow:
        "0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 40px rgba(181, 107, 255, 0.15)",
    }}
    className="max-w-5xl mx-auto w-full p-[3px] rounded-[32px] bg-gradient-to-br from-[#B56BFF] via-[#38BDF8] via-[#4ADE80] to-[#BEF264]"
  >
    <div className="bg-[#0A0A0A] p-2 md:p-6 rounded-[29px] border-4 border-[#0A0A0A]">
      <div className="h-full w-full overflow-hidden rounded-[22px] bg-black">
        {children}
      </div>
    </div>
  </motion.div>
);
