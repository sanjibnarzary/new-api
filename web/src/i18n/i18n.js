/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';
import hiTranslation from './locales/hi.json';
import brxTranslation from './locales/brx.json';
import asTranslation from './locales/as.json';
import bnTranslation from './locales/bn.json';
import guTranslation from './locales/gu.json';
import knTranslation from './locales/kn.json';
import ksTranslation from './locales/ks.json';
import kokTranslation from './locales/kok.json';
import mlTranslation from './locales/ml.json';
import mniTranslation from './locales/mni.json';
import mrTranslation from './locales/mr.json';
import maiTranslation from './locales/mai.json';
import neTranslation from './locales/ne.json';
import orTranslation from './locales/or.json';
import paTranslation from './locales/pa.json';
import saTranslation from './locales/sa.json';
import satTranslation from './locales/sat.json';
import sdTranslation from './locales/sd.json';
import taTranslation from './locales/ta.json';
import teTranslation from './locales/te.json';
import urTranslation from './locales/ur.json';
import doiTranslation from './locales/doi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    load: 'languageOnly',
    resources: {
      en: {
        translation: enTranslation,
      },
      zh: {
        translation: zhTranslation,
      },
      hi: {
        translation: hiTranslation,
      },
      brx: {
        translation: brxTranslation,
      },
      as: {
        translation: asTranslation,
      },
      bn: {
        translation: bnTranslation,
      },
      gu: {
        translation: guTranslation,
      },
      kn: {
        translation: knTranslation,
      },
      ks: {
        translation: ksTranslation,
      },
      kok: {
        translation: kokTranslation,
      },
      ml: {
        translation: mlTranslation,
      },
      mni: {
        translation: mniTranslation,
      },
      mr: {
        translation: mrTranslation,
      },
      mai: {
        translation: maiTranslation,
      },
      ne: {
        translation: neTranslation,
      },
      or: {
        translation: orTranslation,
      },
      pa: {
        translation: paTranslation,
      },
      sa: {
        translation: saTranslation,
      },
      sat: {
        translation: satTranslation,
      },
      sd: {
        translation: sdTranslation,
      },
      ta: {
        translation: taTranslation,
      },
      te: {
        translation: teTranslation,
      },
      ur: {
        translation: urTranslation,
      },
      doi: {
        translation: doiTranslation,
      },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
