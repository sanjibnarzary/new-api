import React, { useEffect, useState } from 'react';
import { API, showError } from '../../helpers';
import { marked } from 'marked';
import { Empty } from '@douyinfe/semi-ui';
import { IllustrationConstruction, IllustrationConstructionDark } from '@douyinfe/semi-illustrations';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);
  const currentYear = new Date().getFullYear();

  const displayAbout = async () => {
    setAbout(localStorage.getItem('about') || '');
    const res = await API.get('/api/about');
    const { success, message, data } = res.data;
    if (success) {
      let aboutContent = data;
      if (!data.startsWith('https://')) {
        aboutContent = marked.parse(data);
      }
      setAbout(aboutContent);
      localStorage.setItem('about', aboutContent);
    } else {
      showError(message);
      setAbout(t('加载关于内容失败...'));
    }
    setAboutLoaded(true);
  };

  useEffect(() => {
    displayAbout().then();
  }, []);

  const emptyStyle = {
    padding: '24px'
  };

  const customDescription = (
    <div style={{ textAlign: 'center' }}>
      <p>{t('You can set the content on the settings page, supporting HTML & Markdown')}</p>
      {t('New API project repository address:')}
      <a
        href='https://github.com/QuantumNous/new-api'
        target="_blank"
        rel="noopener noreferrer"
        className="!text-semi-color-primary"
      >
        https://github.com/QuantumNous/new-api
      </a>
      <p>
        <a
          href="https://github.com/QuantumNous/new-api"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-semi-color-primary"
        >
          NewAPI
        </a> {t('© {{currentYear}}', { currentYear })} <a
          href="https://github.com/QuantumNous"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-semi-color-primary"
        >
          QuantumNous
        </a> {t('| Based on')} <a
          href="https://github.com/songquanpeng/one-api/releases/tag/v0.5.4"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-semi-color-primary"
        >
          One API v0.5.4
        </a> © 2023 <a
          href="https://github.com/songquanpeng"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-semi-color-primary"
        >
          JustSong
        </a>
      </p>
      <p>
        {t('This project is licensed under the ')}
        <a
          href="https://github.com/songquanpeng/one-api/blob/v0.5.4/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-semi-color-primary"
        >
          {t('MIT License')}
        </a>
        {t(' and must be used in compliance with the ')}
        <a
          href="https://github.com/QuantumNous/new-api/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="!text-semi-color-primary"
        >
          {t('Apache-2.0协议')}
        </a>
        {t('used under the premise.')}
      </p>
    </div>
  );

  return (
    <div className="mt-[64px] px-2">
      {aboutLoaded && about === '' ? (
        <div className="flex justify-center items-center h-screen p-8">
          <Empty
            image={<IllustrationConstruction style={{ width: 150, height: 150 }} />}
            darkModeImage={<IllustrationConstructionDark style={{ width: 150, height: 150 }} />}
            description={t('The administrator has not set any custom About content yet')}
            style={emptyStyle}
          >
            {customDescription}
          </Empty>
        </div>
      ) : (
        <>
          {about.startsWith('https://') ? (
            <iframe
              src={about}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            />
          ) : (
            <div
              style={{ fontSize: 'larger' }}
              dangerouslySetInnerHTML={{ __html: about }}
            ></div>
          )}
        </>
      )}
    </div>
  );
};

export default About;
