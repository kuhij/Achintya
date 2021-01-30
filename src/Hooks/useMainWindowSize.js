const useMainWindowSize = () => {
  let width = (window.innerWidth * 9) / 10;
  if (width > 400) width = 400;
  let height = width * (200 / 400);
  let fullHeight = window.innerHeight;
  let fullWidth = window.innerWidth;

  return {
    width,
    height,
    fullHeight,
    fullWidth,
  };
};

export default useMainWindowSize;
