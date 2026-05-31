export const getAlignClass = (align?: string) => {
  switch (align) {
    case "center":
      return "justify-center text-center";
    case "right":
      return "justify-end text-right";
    default:
      return "justify-start text-left";
  }
};
