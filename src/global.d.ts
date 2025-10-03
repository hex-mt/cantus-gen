declare module "*.js" {
    const createModule: () => Promise<any>;
    export default createModule;
}
