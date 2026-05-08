import { SDK } from "ysdk";

interface IProps {
  sdk?: SDK;
  setLocaleFromString(locale:string):void;
}

export class LocaleService {
  constructor(private props: IProps) {
    this.autoSetupLanguage();
  }

  private autoSetupLanguage(){
    const locale = this.getLocale();
    this.props.setLocaleFromString(locale);
  }

  private getLocale(defaultLocale='ru'):string {
    return  this.props.sdk?.environment.i18n.lang ?? defaultLocale;
  }
}
