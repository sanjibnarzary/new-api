/*
AGPL License Header omitted for brevity - mirror other files
*/
import React, { useEffect, useState, useRef } from 'react';
import { Banner, Button, Form, Row, Col, Typography, Spin } from '@douyinfe/semi-ui';
const { Text } = Typography;
import { API, removeTrailingSlash, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsPaymentGatewayRazorpay(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    RazorpayKeyId: '',
    RazorpayKeySecret: '',
    RazorpayWebhookSecret: '',
  });
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        RazorpayKeyId: props.options.RazorpayKeyId || '',
        RazorpayKeySecret: props.options.RazorpayKeySecret || '',
        RazorpayWebhookSecret: props.options.RazorpayWebhookSecret || '',
      };
      setInputs(currentInputs);
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitRazorpaySetting = async () => {
    if (props.options.ServerAddress === '') {
      showError(t('请先填写服务器地址'));
      return;
    }
    setLoading(true);
    try {
      const options = [];
      if (inputs.RazorpayKeyId) {
        options.push({ key: 'RazorpayKeyId', value: inputs.RazorpayKeyId });
      }
      if (inputs.RazorpayKeySecret) {
        options.push({ key: 'RazorpayKeySecret', value: inputs.RazorpayKeySecret });
      }
      if (inputs.RazorpayWebhookSecret) {
        options.push({ key: 'RazorpayWebhookSecret', value: inputs.RazorpayWebhookSecret });
      }
      const results = await Promise.all(options.map(opt => API.put('/api/option/', opt)));
      const errorResults = results.filter(r => !r.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach(r => showError(r.data.message));
      } else {
        showSuccess(t('更新成功'));
        props.refresh?.();
      }
    } catch (e) {
      showError(t('更新失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Form initValues={inputs} onValueChange={handleFormChange} getFormApi={api => (formApiRef.current = api)}>
        <Form.Section text={t('Razorpay 设置')}>
          <Text>
            Razorpay API Key / Webhook 设置，请访问
            <a href='https://dashboard.razorpay.com/app/keys' target='_blank' rel='noreferrer'> Razorpay Dashboard </a>
            生成 Key。<br />
          </Text>
          <Banner type='info' description={`Webhook URL: ${props.options.ServerAddress ? removeTrailingSlash(props.options.ServerAddress) : t('网站地址')}/api/razorpay/webhook`} />
          <Banner type='warning' description={t('确保启用 payment.captured 事件')} />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input field='RazorpayKeyId' label={t('Key Id')} placeholder={t('Razorpay Key Id，敏感信息不显示')} type='password' />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input field='RazorpayKeySecret' label={t('Key Secret')} placeholder={t('Razorpay Key Secret，敏感信息不显示')} type='password' />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input field='RazorpayWebhookSecret' label={t('Webhook 密钥')} placeholder={t('Webhook Secret，敏感信息不显示')} type='password' />
            </Col>
          </Row>
          <Button onClick={submitRazorpaySetting}>{t('更新 Razorpay 设置')}</Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}
