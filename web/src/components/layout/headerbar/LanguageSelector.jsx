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

import React from 'react';
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { Languages } from 'lucide-react';
import { CN, GB, IN } from 'country-flag-icons/react/3x2';

const LanguageSelector = ({ currentLang, onLanguageChange, t }) => {
  return (
    <Dropdown
      position='bottomRight'
      render={
        <Dropdown.Menu className='!bg-semi-color-bg-overlay !border-semi-color-border !shadow-lg !rounded-lg dark:!bg-gray-700 dark:!border-gray-600'>
           <Dropdown.Item
            onClick={() => onLanguageChange('hi')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'hi' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='हिन्दी' className='!w-5 !h-auto' />
            <span>हिन्दी (Hindi)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('en')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'en' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <GB title='English' className='!w-5 !h-auto' />
            <span>English</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('as')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'as' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Assamese' className='!w-5 !h-auto' />
            <span>অসমীয়া (Assamese)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('bn')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'bn' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Bengali' className='!w-5 !h-auto' />
            <span>বাংলা (Bangla)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('brx')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'brx' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title="बर'" className='!w-5 !h-auto' />
            <span>बर'/बड़ो (Bodo)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('doi')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'doi' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Dogri' className='!w-5 !h-auto' />
            <span>डोगरी (Dogri)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('gu')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'gu' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Gujarati' className='!w-5 !h-auto' />
            <span>ગુજરાતી (Gujarati)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('kn')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'kn' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Kannada' className='!w-5 !h-auto' />
            <span>ಕನ್ನಡ (Kannada)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('ks')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'ks' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Kashmiri' className='!w-5 !h-auto' />
            <span>कश्मीरी (Kashmiri)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('kok')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'kok' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='कोकणी' className='!w-5 !h-auto' />
            <span>कोंकणी (Konkani)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('ml')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'ml' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Malayalam' className='!w-5 !h-auto' />
            <span>മലയാളം (Malayalam)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('mni')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'mni' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Manipuri' className='!w-5 !h-auto' />
            <span>ꯃꯩꯇꯩꯂꯣꯟ (Meitei)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('mr')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'mr' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Marathi' className='!w-5 !h-auto' />
            <span>मराठी (Marathi)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('mai')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'mai' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='मैथिली' className='!w-5 !h-auto' />
            <span>मैथिली (Maithili)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('ne')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'ne' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Nepali' className='!w-5 !h-auto' />
            <span>नेपाली (Nepali)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('or')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'or' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Odia' className='!w-5 !h-auto' />
            <span>ଓଡ଼ିଆ (Odia)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('pa')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'pa' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Punjabi' className='!w-5 !h-auto' />
            <span>ਪੰਜਾਬੀ (Punjabi)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('sa')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'sa' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Sanskrit' className='!w-5 !h-auto' />
            <span>संस्कृत (Sanskrit)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('sat')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'sat' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Santali' className='!w-5 !h-auto' />
            <span>संथाली (Santali)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('sd')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'sd' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Sindhi' className='!w-5 !h-auto' />
            <span>سنڌي (Sindhi)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('ta')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'ta' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Tamil' className='!w-5 !h-auto' />
            <span>தமிழ் (Tamil)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('te')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'te' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='Telugu' className='!w-5 !h-auto' />
            <span>తెలుగు (Telugu)</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onLanguageChange('ur')}
            className={`!flex !items-center !gap-2 !px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === 'ur' ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
          >
            <IN title='उर्दू' className='!w-5 !h-auto' />
            <span>اُردُو (Urdu)</span>
          </Dropdown.Item>
             
        </Dropdown.Menu>
      }
    >
      <Button
        icon={<Languages size={18} />}
        aria-label={t('切换语言')}
        theme='borderless'
        type='tertiary'
        className='!p-1.5 !text-current focus:!bg-semi-color-fill-1 dark:focus:!bg-gray-700 !rounded-full !bg-semi-color-fill-0 dark:!bg-semi-color-fill-1 hover:!bg-semi-color-fill-1 dark:hover:!bg-semi-color-fill-2'
      />
    </Dropdown>
  );
};

export default LanguageSelector;
