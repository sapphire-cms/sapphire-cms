import { staticBootstrap } from '@sapphire-cms/bundle';
import { CmsLoader } from '@sapphire-cms/core';

const cmsLoader = new CmsLoader(staticBootstrap);

cmsLoader
  .loadSapphireCms()
  .flatMap((sapphireCms) => sapphireCms.run())
  .match(
    () => {},
    (err) => {
      console.error(err);
    },
    (defect) => {
      console.error(defect);
    },
  );
