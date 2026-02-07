declare module "date-picker-np" {
  type Options = {
    closeOnDateSelect?: boolean;
    onChange?: (value: string) => void;
  };

  // Most builds export a function, not a class
  const init: (el: HTMLInputElement, options?: Options) => any;
  export default init;
}
