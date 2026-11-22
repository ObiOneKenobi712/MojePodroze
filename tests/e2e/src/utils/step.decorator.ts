import { test } from "@playwright/test";

type StepName = string | ((...args: any[]) => string);

export function step(stepName?: StepName) {
  return function <T extends (...args: any[]) => Promise<any>>(target: T, context: ClassMethodDecoratorContext) {
    return function (this: any, ...args: Parameters<T>) {
      const defaultName = `${this.constructor.name}.${String(context.name)}`;
      const name = typeof stepName === "function" ? stepName(...args) : (stepName ?? defaultName);

      return test.step(name, () => target.apply(this, args), { box: true });
    };
  };
}
