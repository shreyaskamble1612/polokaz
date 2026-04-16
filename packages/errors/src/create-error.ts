export interface PolokazError<Extensions = void> extends Error {
  extensions: Extensions;
  code: string;
  status: number;
}

export interface PolokazErrorConstructor<Extensions = void> {
  new (
    extensions: Extensions,
    options?: ErrorOptions,
  ): PolokazError<Extensions>;
  readonly prototype: PolokazError<Extensions>;
}

export const createError = <Extensions = void>(
  code: string,
  message: string | ((extensions: Extensions) => string),
  status = 500,
): PolokazErrorConstructor<Extensions> => {
  return class extends Error implements PolokazError<Extensions> {
    override name = "PolokazError";
    extensions: Extensions;
    code = code.toUpperCase();
    status = status;

    constructor(extensions: Extensions, options?: ErrorOptions) {
      const msg =
        typeof message === "string"
          ? message
          : message(extensions as Extensions);

      super(msg, options);

      this.extensions = extensions;
    }

    override toString() {
      return `${this.name} [${this.code}]: ${this.message}`;
    }
  };
};
