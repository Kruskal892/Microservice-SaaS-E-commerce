declare module '*.svg' {
  import type { ComponentType, SVGProps } from 'react';

  const Svg: ComponentType<SVGProps<SVGSVGElement>>;
  export default Svg;
}
