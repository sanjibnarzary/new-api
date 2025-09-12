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

import React, { useState, useEffect, useRef } from 'react';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  showWarning,
  verifyJSON,
  selectFilter,
} from '../../../../helpers';
import {
  SideSheet,
  Space,
  Button,
  Typography,
  Spin,
  Banner,
  Card,
  Tag,
  Avatar,
  Form,
} from '@douyinfe/semi-ui';
import {
  IconSave,
  IconClose,
  IconBookmark,
  IconUser,
  IconCode,
} from '@douyinfe/semi-icons';
import { getChannelModels } from '../../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo': 'gpt-3.5-turbo-0125',
};

const EditTagModal = (props) => {
  const { t } = useTranslation();
  const { visible, tag, handleClose, refresh } = props;
  const [loading, setLoading] = useState(false);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const originInputs = {
    tag: '',
    new_tag: null,
    model_mapping: null,
    groups: [],
    models: [],
  };
  const [inputs, setInputs] = useState(originInputs);
  const formApiRef = useRef(null);
  const getInitValues = () => ({ ...originInputs });

  const handleInputChange = (name, value) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
    if (formApiRef.current) {
      formApiRef.current.setValue(name, value);
    }
    if (name === 'type') {
      let localModels = [];
      switch (value) {
        case 2:
          localModels = [
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_uploads',
          ];
          break;
        case 5:
          localModels = [
            'swap_face',
            'mj_imagine',
            'mj_video',
            'mj_edits',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_zoom',
            'mj_shorten',
            'mj_modal',
            'mj_inpaint',
            'mj_custom_zoom',
            'mj_high_variation',
            'mj_low_variation',
            'mj_pan',
            'mj_uploads',
          ];
          break;
        case 36:
          localModels = ['suno_music', 'suno_lyrics'];
          break;
        default:
          localModels = getChannelModels(value);
          break;
      }
      if (inputs.models.length === 0) {
        setInputs((inputs) => ({ ...inputs, models: localModels }));
      }
    }
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      let localModelOptions = res.data.data.map((model) => ({
        label: model.id,
        value: model.id,
      }));
      setOriginModelOptions(localModelOptions);
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) {
        return;
      }
      setGroupOptions(
        res.data.data.map((group) => ({
          label: group,
          value: group,
        })),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    const formVals = values || formApiRef.current?.getValues() || {};
    let data = { tag };
    if (formVals.model_mapping) {
      if (!verifyJSON(formVals.model_mapping)) {
        showInfo('模型映射必须是合法的 JSON 格式！');
        setLoading(false);
        return;
      }
      data.model_mapping = formVals.model_mapping;
    }
    if (formVals.groups && formVals.groups.length > 0) {
      data.groups = formVals.groups.join(',');
    }
    if (formVals.models && formVals.models.length > 0) {
      data.models = formVals.models.join(',');
    }
    data.new_tag = formVals.new_tag;
    if (
      data.model_mapping === undefined &&
      data.groups === undefined &&
      data.models === undefined &&
      data.new_tag === undefined
    ) {
      showWarning('没有任何修改！');
      setLoading(false);
      return;
    }
    await submit(data);
    setLoading(false);
  };

  const submit = async (data) => {
    try {
      const res = await API.put('/api/channel/tag', data);
      if (res?.data?.success) {
        showSuccess('标签更新成功！');
        refresh();
        handleClose();
      }
    } catch (error) {
      showError(error);
    }
  };

  useEffect(() => {
    let localModelOptions = [...originModelOptions];
    inputs.models.forEach((model) => {
      if (!localModelOptions.find((option) => option.label === model)) {
        localModelOptions.push({
          label: model,
          value: model,
        });
      }
    });
    setModelOptions(localModelOptions);
  }, [originModelOptions, inputs.models]);

  useEffect(() => {
    const fetchTagModels = async () => {
      if (!tag) return;
      setLoading(true);
      try {
        const res = await API.get(`/api/channel/tag/models?tag=${tag}`);
        if (res?.data?.success) {
          const models = res.data.data ? res.data.data.split(',') : [];
          handleInputChange('models', models);
        } else {
          showError(res.data.message);
        }
      } catch (error) {
        showError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModels().then();
    fetchGroups().then();
    fetchTagModels().then();
    if (formApiRef.current) {
      formApiRef.current.setValues({
        ...getInitValues(),
        tag: tag,
        new_tag: tag,
      });
    }

    setInputs({
      ...originInputs,
      tag: tag,
      new_tag: tag,
    });
  }, [visible, tag]);

  useEffect(() => {
    if (formApiRef.current) {
      formApiRef.current.setValues(inputs);
    }
  }, [inputs]);

  const addCustomModels = () => {
    if (customModel.trim() === '') return;
    const modelArray = customModel.split(',').map((model) => model.trim());

    let localModels = [...inputs.models];
    let localModelOptions = [...modelOptions];
    const addedModels = [];

    modelArray.forEach((model) => {
      if (model && !localModels.includes(model)) {
        localModels.push(model);
        localModelOptions.push({
          key: model,
          text: model,
          value: model,
        });
        addedModels.push(model);
      }
    });

    setModelOptions(localModelOptions);
    setCustomModel('');
    handleInputChange('models', localModels);

    if (addedModels.length > 0) {
      showSuccess(
        t('已新增 {{count}} 个模型：{{list}}', {
          count: addedModels.length,
          list: addedModels.join(', '),
        }),
      );
    } else {
      showInfo(t('No new models were added'));
    }
  };

  return (
    <SideSheet
      placement='right'
      title={
        <Space>
<<<<<<< Updated upstream
<<<<<<< Updated upstream:web/src/pages/Channel/EditTagModal.js
=======
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
>>>>>>> Stashed changes
          <Tag color="blue" shape="circle">{t('Edit')}</Tag>
          <Title heading={4} className="m-0">
            {t('Edit Tag')}
=======
<<<<<<< Updated upstream
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
          <Tag color="blue" shape="circle">{t('Edit')}</Tag>
          <Title heading={4} className="m-0">
            {t('Edit Tag')}
=======
=======
>>>>>>> Stashed changes
          <Tag color='blue' shape='circle'>
            {t('编辑')}
          </Tag>
          <Title heading={4} className='m-0'>
            {t('编辑标签')}
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
<<<<<<< Updated upstream
>>>>>>> Stashed changes:web/src/components/table/channels/modals/EditTagModal.jsx
=======
>>>>>>> Stashed changes
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '0' }}
      visible={visible}
      width={600}
      onCancel={handleClose}
      footer={
        <div className='flex justify-end bg-white'>
          <Space>
            <Button
              theme='solid'
              onClick={() => formApiRef.current?.submitForm()}
              loading={loading}
              icon={<IconSave />}
            >
              {t('保存')}
            </Button>
            <Button
              theme='light'
              type='primary'
              onClick={handleClose}
              icon={<IconClose />}
            >
              {t('取消')}
            </Button>
          </Space>
        </div>
      }
      closeIcon={null}
    >
      <Form
        key={tag || 'edit'}
        initValues={getInitValues()}
        getFormApi={(api) => (formApiRef.current = api)}
        onSubmit={handleSave}
      >
        {() => (
          <Spin spinning={loading}>
            <div className='p-2'>
              <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                {/* Header: Tag Info */}
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='blue' className='mr-2 shadow-md'>
                    <IconBookmark size={16} />
                  </Avatar>
                  <div>
<<<<<<< Updated upstream
<<<<<<< Updated upstream:web/src/pages/Channel/EditTagModal.js
                    <Text className="text-lg font-medium">{t('Tag Information')}</Text>
                    <div className="text-xs text-gray-600">{t('Tag basic configuration')}</div>
=======
=======
>>>>>>> Stashed changes
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
                    <Text className="text-lg font-medium">{t('Tag Information')}</Text>
                    <div className="text-xs text-gray-600">{t('Tag basic configuration')}</div>
=======
                    <Text className='text-lg font-medium'>{t('标签信息')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('标签的基本配置')}
                    </div>
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
<<<<<<< Updated upstream
>>>>>>> Stashed changes:web/src/components/table/channels/modals/EditTagModal.jsx
=======
>>>>>>> Stashed changes
                  </div>
                </div>

                <Banner
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
                  type="warning"
                  description={t('All edits are overwrite operations, leaving blank will not change')}
                  className="!rounded-lg mb-4"
=======
                  type='warning'
                  description={t('所有编辑均为覆盖操作，留空则不更改')}
                  className='!rounded-lg mb-4'
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
                />

                <div className='space-y-4'>
                  <Form.Input
                    field='new_tag'
                    label={t('Tag Name')}
                    placeholder={t('Please enter a new tag to parse the key file. Leaving it blank will dissolve the tag.')}
                    onChange={(value) => handleInputChange('new_tag', value)}
                  />
                </div>
              </Card>

              <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                {/* Header: Model Config */}
                <div className='flex items-center mb-2'>
                  <Avatar
                    size='small'
                    color='purple'
                    className='mr-2 shadow-md'
                  >
                    <IconCode size={16} />
                  </Avatar>
                  <div>
<<<<<<< Updated upstream
<<<<<<< Updated upstream:web/src/pages/Channel/EditTagModal.js
                    <Text className="text-lg font-medium">{t('Model Configuration')}</Text>
                    <div className="text-xs text-gray-600">{t('Model selection and mapping settings')}</div>
=======
=======
>>>>>>> Stashed changes
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
                    <Text className="text-lg font-medium">{t('Model Configuration')}</Text>
                    <div className="text-xs text-gray-600">{t('Model selection and mapping settings')}</div>
=======
                    <Text className='text-lg font-medium'>{t('模型配置')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('模型选择和映射设置')}
                    </div>
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
<<<<<<< Updated upstream
>>>>>>> Stashed changes:web/src/components/table/channels/modals/EditTagModal.jsx
=======
>>>>>>> Stashed changes
                  </div>
                </div>

                <div className='space-y-4'>
                  <Banner
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
                    type="info"
                    description={t('Current model list is the longest among all channels under this tag, not a union, may cause some channel models to be lost.')}
                    className="!rounded-lg mb-4"
=======
                    type='info'
                    description={t(
                      '当前模型列表为该标签下所有渠道模型列表最长的一个，并非所有渠道的并集，请注意可能导致某些渠道模型丢失。',
                    )}
                    className='!rounded-lg mb-4'
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
                  />
                  <Form.Select
                    field='models'
                    label={t('Model')}
                    placeholder={t('Please select the models supported by the channel, leaving blank will not change')}
                    multiple
                    filter={selectFilter}
                    autoClearSearchValue={false}
                    searchPosition='dropdown'
                    optionList={modelOptions}
                    style={{ width: '100%' }}
                    onChange={(value) => handleInputChange('models', value)}
                  />

                  <Form.Input
                    field='custom_model'
                    label={t('Custom model name')}
                    placeholder={t('输入自定义模型名称')}
                    onChange={(value) => setCustomModel(value.trim())}
                    suffix={
                      <Button
                        size='small'
                        type='primary'
                        onClick={addCustomModels}
                      >
                        {t('填入')}
                      </Button>
                    }
                  />

                  <Form.TextArea
                    field='model_mapping'
<<<<<<< Updated upstream
<<<<<<< Updated upstream:web/src/pages/Channel/EditTagModal.js
=======
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
>>>>>>> Stashed changes:web/src/components/table/channels/modals/EditTagModal.jsx
=======
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
>>>>>>> Stashed changes
                    label={t('Model Mapping')}
                    placeholder={t('This is optional, used to modify the model name in the request body, as a JSON string, the key is the model name in the request, the value is the model name to be replaced, leaving blank will not change')}
                    autosize
                    onChange={(value) => handleInputChange('model_mapping', value)}
                    extraText={(
                      <Space>
                        <Text className="!text-semi-color-primary cursor-pointer" onClick={() => handleInputChange('model_mapping', JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2))}>{t('Fill Template')}</Text>
                        <Text className="!text-semi-color-primary cursor-pointer" onClick={() => handleInputChange('model_mapping', JSON.stringify({}, null, 2))}>{t('Clear Mapping')}</Text>
                        <Text className="!text-semi-color-primary cursor-pointer" onClick={() => handleInputChange('model_mapping', '')}>{t('Do not change')}</Text>
                      </Space>
=======
                    label={t('模型重定向')}
                    placeholder={t(
                      '此项可选，用于修改请求体中的模型名称，为一个 JSON 字符串，键为请求中模型名称，值为要替换的模型名称，留空则不更改',
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
                    )}
                    autosize
                    onChange={(value) =>
                      handleInputChange('model_mapping', value)
                    }
                    extraText={
                      <Space>
                        <Text
                          className='!text-semi-color-primary cursor-pointer'
                          onClick={() =>
                            handleInputChange(
                              'model_mapping',
                              JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2),
                            )
                          }
                        >
                          {t('填入模板')}
                        </Text>
                        <Text
                          className='!text-semi-color-primary cursor-pointer'
                          onClick={() =>
                            handleInputChange(
                              'model_mapping',
                              JSON.stringify({}, null, 2),
                            )
                          }
                        >
                          {t('清空重定向')}
                        </Text>
                        <Text
                          className='!text-semi-color-primary cursor-pointer'
                          onClick={() => handleInputChange('model_mapping', '')}
                        >
                          {t('不更改')}
                        </Text>
                      </Space>
                    }
                  />
                </div>
              </Card>

              <Card className='!rounded-2xl shadow-sm border-0'>
                {/* Header: Group Settings */}
                <div className='flex items-center mb-2'>
                  <Avatar size='small' color='green' className='mr-2 shadow-md'>
                    <IconUser size={16} />
                  </Avatar>
                  <div>
<<<<<<< Updated upstream
<<<<<<< Updated upstream:web/src/pages/Channel/EditTagModal.js
                    <Text className="text-lg font-medium">{t('Group settings')}</Text>
                    <div className="text-xs text-gray-600">{t('User group configuration')}</div>
=======
=======
>>>>>>> Stashed changes
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
                    <Text className="text-lg font-medium">{t('Group settings')}</Text>
                    <div className="text-xs text-gray-600">{t('User group configuration')}</div>
=======
                    <Text className='text-lg font-medium'>{t('分组设置')}</Text>
                    <div className='text-xs text-gray-600'>
                      {t('用户分组配置')}
                    </div>
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
<<<<<<< Updated upstream
>>>>>>> Stashed changes:web/src/components/table/channels/modals/EditTagModal.jsx
=======
>>>>>>> Stashed changes
                  </div>
                </div>

                <div className='space-y-4'>
                  <Form.Select
                    field='groups'
                    label={t('Groups')}
                    placeholder={t('Please select the groups that can use this channel, leaving blank will not change')}
                    multiple
                    allowAdditions
<<<<<<< Updated upstream
<<<<<<< Updated upstream:web/src/pages/Channel/EditTagModal.js
                    additionLabel={t('Edit group ratio in system settings to add new group:')}
=======
=======
>>>>>>> Stashed changes
<<<<<<< HEAD:web/src/pages/Channel/EditTagModal.js
                    additionLabel={t('Edit group ratio in system settings to add new group:')}
=======
                    additionLabel={t(
                      '请在系统设置页面编辑分组倍率以添加新的分组：',
                    )}
>>>>>>> 93adcd57d7d851d90ee051e1daf8db7ea6b52655:web/src/components/table/channels/modals/EditTagModal.jsx
<<<<<<< Updated upstream
>>>>>>> Stashed changes:web/src/components/table/channels/modals/EditTagModal.jsx
=======
>>>>>>> Stashed changes
                    optionList={groupOptions}
                    style={{ width: '100%' }}
                    onChange={(value) => handleInputChange('groups', value)}
                  />
                </div>
              </Card>
            </div>
          </Spin>
        )}
      </Form>
    </SideSheet>
  );
};

export default EditTagModal;
