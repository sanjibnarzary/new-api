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

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  verifyJSON,
} from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { CHANNEL_OPTIONS } from '../../../../constants';
import {
  SideSheet,
  Space,
  Spin,
  Button,
  Typography,
  Checkbox,
  Banner,
  Modal,
  ImagePreview,
  Card,
  Tag,
  Avatar,
  Form,
  Row,
  Col,
  Highlight,
  Input,
} from '@douyinfe/semi-ui';
import {
  getChannelModels,
  copy,
  getChannelIcon,
  getModelCategories,
  selectFilter,
} from '../../../../helpers';
import ModelSelectModal from './ModelSelectModal';
import JSONEditor from '../../../common/ui/JSONEditor';
import TwoFactorAuthModal from '../../../common/modals/TwoFactorAuthModal';
import ChannelKeyDisplay from '../../../common/ui/ChannelKeyDisplay';
import {
  IconSave,
  IconClose,
  IconServer,
  IconSetting,
  IconCode,
  IconGlobe,
  IconBolt,
} from '@douyinfe/semi-icons';

const { Text, Title } = Typography;

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo': 'gpt-3.5-turbo-0125',
};

const STATUS_CODE_MAPPING_EXAMPLE = {
  400: '500',
};

const REGION_EXAMPLE = {
  default: 'global',
  'gemini-1.5-pro-002': 'europe-west2',
  'gemini-1.5-flash-002': 'europe-west2',
  'claude-3-5-sonnet-20240620': 'europe-west1',
};

// 支持并且已适配通过接口获取模型列表的渠道类型
const MODEL_FETCHABLE_TYPES = new Set([
  1,
  4,
  14,
  34,
  17,
  26,
  24,
  47,
  25,
  20,
  23,
  31,
  35,
  40,
  42,
  48,
]);

function type2secretPrompt(type) {
  // inputs.type === 15 ? '按照如下格式输入：APIKey|SecretKey' : (inputs.type === 18 ? '按照如下格式输入：APPID|APISecret|APIKey' : '请输入渠道对应的鉴权密钥')
  switch (type) {
    case 15:
      return 'Enter in the following format: APIKey|SecretKey';
    case 18:
      return 'Enter in the following format: APPID|APISecret|APIKey';
    case 22:
      return 'Enter in the following format: APIKey-AppId, e.g.: fastgpt-0sp2gtvfdgyi4k30jwlgwf1i-64f335d84283f05518e9e041';
    case 23:
      return 'Enter in the following format: AppId|SecretId|SecretKey';
    case 33:
      return 'Enter in the following format: Ak|Sk|Region';
    case 50:
      return 'Enter in the following format: AccessKey|SecretKey. If the upstream is New API, just enter ApiKey';
    case 51:
      return 'Enter in the following format: Access Key ID|Secret Access Key';
    default:
      return 'Please enter the authentication key for the selected channel';
  }
}

const EditChannelModal = (props) => {
  const { t } = useTranslation();
  const channelId = props.editingChannel.id;
  const isEdit = channelId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const isMobile = useIsMobile();
  const handleCancel = () => {
    props.handleClose();
  };
  const originInputs = {
    name: '',
    type: 1,
    key: '',
    openai_organization: '',
    max_input_tokens: 0,
    base_url: '',
    other: '',
    model_mapping: '',
    status_code_mapping: '',
    models: [],
    auto_ban: 1,
    test_model: '',
    groups: ['default'],
    priority: 0,
    weight: 0,
    tag: '',
    multi_key_mode: 'random',
    // 渠道额外设置的默认值
    force_format: false,
    thinking_to_content: false,
    proxy: '',
    pass_through_body_enabled: false,
    system_prompt: '',
    system_prompt_override: false,
    settings: '',
    // 仅 Vertex: 密钥格式（存入 settings.vertex_key_type）
    vertex_key_type: 'json',
    // 企业账户设置
    is_enterprise_account: false,
  };
  const [batch, setBatch] = useState(false);
  const [multiToSingle, setMultiToSingle] = useState(false);
  const [multiKeyMode, setMultiKeyMode] = useState('random');
  const [autoBan, setAutoBan] = useState(true);
  const [inputs, setInputs] = useState(originInputs);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const [modelGroups, setModelGroups] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [fetchedModels, setFetchedModels] = useState([]);
  const formApiRef = useRef(null);
  const [vertexKeys, setVertexKeys] = useState([]);
  const [vertexFileList, setVertexFileList] = useState([]);
  const vertexErroredNames = useRef(new Set()); // 避免重复报错
  const [isMultiKeyChannel, setIsMultiKeyChannel] = useState(false);
  const [channelSearchValue, setChannelSearchValue] = useState('');
  const [useManualInput, setUseManualInput] = useState(false); // 是否使用手动输入模式
  const [keyMode, setKeyMode] = useState('append'); // 密钥模式：replace（覆盖）或 append（追加）
  const [isEnterpriseAccount, setIsEnterpriseAccount] = useState(false); // 是否为企业账户

  // 2FA验证查看密钥相关状态
  const [twoFAState, setTwoFAState] = useState({
    showModal: false,
    code: '',
    loading: false,
    showKey: false,
    keyData: '',
  });

  // 专门的2FA验证状态（用于TwoFactorAuthModal）
  const [show2FAVerifyModal, setShow2FAVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // 2FA状态更新辅助函数
  const updateTwoFAState = (updates) => {
    setTwoFAState((prev) => ({ ...prev, ...updates }));
  };

  // 重置2FA状态
  const resetTwoFAState = () => {
    setTwoFAState({
      showModal: false,
      code: '',
      loading: false,
      showKey: false,
      keyData: '',
    });
  };

  // 重置2FA验证状态
  const reset2FAVerifyState = () => {
    setShow2FAVerifyModal(false);
    setVerifyCode('');
    setVerifyLoading(false);
  };

  // 渠道额外设置状态
  const [channelSettings, setChannelSettings] = useState({
    force_format: false,
    thinking_to_content: false,
    proxy: '',
    pass_through_body_enabled: false,
    system_prompt: '',
  });
  const showApiConfigCard = true; // 控制是否显示 API 配置卡片
  const getInitValues = () => ({ ...originInputs });

  // 处理渠道额外设置的更新
  const handleChannelSettingsChange = (key, value) => {
    // 更新内部状态
    setChannelSettings((prev) => ({ ...prev, [key]: value }));

    // 同步更新到表单字段
    if (formApiRef.current) {
      formApiRef.current.setValue(key, value);
    }

    // 同步更新inputs状态
    setInputs((prev) => ({ ...prev, [key]: value }));

    // 生成setting JSON并更新
    const newSettings = { ...channelSettings, [key]: value };
    const settingsJson = JSON.stringify(newSettings);
    handleInputChange('setting', settingsJson);
  };

  const handleChannelOtherSettingsChange = (key, value) => {
    // 更新内部状态
    setChannelSettings((prev) => ({ ...prev, [key]: value }));

    // 同步更新到表单字段
    if (formApiRef.current) {
      formApiRef.current.setValue(key, value);
    }

    // 同步更新inputs状态
    setInputs((prev) => ({ ...prev, [key]: value }));

    // 需要更新settings，是一个json，例如{"azure_responses_version": "preview"}
    let settings = {};
    if (inputs.settings) {
      try {
        settings = JSON.parse(inputs.settings);
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
    settings[key] = value;
    const settingsJson = JSON.stringify(settings);
    handleInputChange('settings', settingsJson);
  };

  const handleInputChange = (name, value) => {
    if (formApiRef.current) {
      formApiRef.current.setValue(name, value);
    }
    if (name === 'models' && Array.isArray(value)) {
      value = Array.from(new Set(value.map((m) => (m || '').trim())));
    }

    if (name === 'base_url' && value.endsWith('/v1')) {
      Modal.confirm({
        title: 'Warning',
        content:
          'You do not need to add /v1 at the end. New API will handle it automatically. Adding it may cause request failures. Do you want to continue?',
        onOk: () => {
          setInputs((inputs) => ({ ...inputs, [name]: value }));
        },
      });
      return;
    }
    setInputs((inputs) => ({ ...inputs, [name]: value }));
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
        case 45:
          localModels = getChannelModels(value);
          setInputs((prevInputs) => ({ ...prevInputs, base_url: 'https://ark.cn-beijing.volces.com' }));
          break;
        default:
          localModels = getChannelModels(value);
          break;
      }
      if (inputs.models.length === 0) {
        setInputs((inputs) => ({ ...inputs, models: localModels }));
      }
      setBasicModels(localModels);

      // 重置手动输入模式状态
      setUseManualInput(false);
    }
    //setAutoBan
  };

  const loadChannel = async () => {
    setLoading(true);
    let res = await API.get(`/api/channel/${channelId}`);
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (data.models === '') {
        data.models = [];
      } else {
        data.models = data.models.split(',');
      }
      if (data.group === '') {
        data.groups = [];
      } else {
        data.groups = data.group.split(',');
      }
      if (data.model_mapping !== '') {
        data.model_mapping = JSON.stringify(
          JSON.parse(data.model_mapping),
          null,
          2,
        );
      }
      const chInfo = data.channel_info || {};
      const isMulti = chInfo.is_multi_key === true;
      setIsMultiKeyChannel(isMulti);
      if (isMulti) {
        setBatch(true);
        setMultiToSingle(true);
        const modeVal = chInfo.multi_key_mode || 'random';
        setMultiKeyMode(modeVal);
        data.multi_key_mode = modeVal;
      } else {
        setBatch(false);
        setMultiToSingle(false);
      }
      // 解析渠道额外设置并合并到data中
      if (data.setting) {
        try {
          const parsedSettings = JSON.parse(data.setting);
          data.force_format = parsedSettings.force_format || false;
          data.thinking_to_content =
            parsedSettings.thinking_to_content || false;
          data.proxy = parsedSettings.proxy || '';
          data.pass_through_body_enabled =
            parsedSettings.pass_through_body_enabled || false;
          data.system_prompt = parsedSettings.system_prompt || '';
          data.system_prompt_override =
            parsedSettings.system_prompt_override || false;
        } catch (error) {
            console.error('Failed to parse channel settings:', error);
          data.force_format = false;
          data.thinking_to_content = false;
          data.proxy = '';
          data.pass_through_body_enabled = false;
          data.system_prompt = '';
          data.system_prompt_override = false;
        }
      } else {
        data.force_format = false;
        data.thinking_to_content = false;
        data.proxy = '';
        data.pass_through_body_enabled = false;
        data.system_prompt = '';
        data.system_prompt_override = false;
      }

      if (data.settings) {
        try {
          const parsedSettings = JSON.parse(data.settings);
          data.azure_responses_version =
            parsedSettings.azure_responses_version || '';
          // 读取 Vertex 密钥格式
          data.vertex_key_type = parsedSettings.vertex_key_type || 'json';
          // 读取企业账户设置
          data.is_enterprise_account = parsedSettings.openrouter_enterprise === true;
        } catch (error) {
            console.error('Failed to parse other settings:', error);
          data.azure_responses_version = '';
          data.region = '';
          data.vertex_key_type = 'json';
          data.is_enterprise_account = false;
        }
      } else {
        // 兼容历史数据：老渠道没有 settings 时，默认按 json 展示
        data.vertex_key_type = 'json';
        data.is_enterprise_account = false;
      }

      setInputs(data);
      if (formApiRef.current) {
        formApiRef.current.setValues(data);
      }
      if (data.auto_ban === 0) {
        setAutoBan(false);
      } else {
        setAutoBan(true);
      }
      // 同步企业账户状态
      setIsEnterpriseAccount(data.is_enterprise_account || false);
      setBasicModels(getChannelModels(data.type));
      // 同步更新channelSettings状态显示
      setChannelSettings({
        force_format: data.force_format,
        thinking_to_content: data.thinking_to_content,
        proxy: data.proxy,
        pass_through_body_enabled: data.pass_through_body_enabled,
        system_prompt: data.system_prompt,
        system_prompt_override: data.system_prompt_override || false,
      });
      // console.log(data);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fetchUpstreamModelList = async (name) => {
    // if (inputs['type'] !== 1) {
    //   showError(t('仅支持 OpenAI 接口格式'));
    //   return;
    // }
    setLoading(true);
    const models = [];
    let err = false;

    if (isEdit) {
      // 如果是编辑模式，使用已有的 channelId 获取模型列表
      const res = await API.get('/api/channel/fetch_models/' + channelId, {
        skipErrorHandler: true,
      });
      if (res && res.data && res.data.success) {
        models.push(...res.data.data);
      } else {
        err = true;
      }
    } else {
      // 如果是新建模式，通过后端代理获取模型列表
      if (!inputs?.['key']) {
        showError(t('Please enter the key'));
        err = true;
      } else {
        try {
          const res = await API.post(
            '/api/channel/fetch_models',
            {
              base_url: inputs['base_url'],
              type: inputs['type'],
              key: inputs['key'],
            },
            { skipErrorHandler: true },
          );

          if (res && res.data && res.data.success) {
            models.push(...res.data.data);
          } else {
            err = true;
          }
        } catch (error) {
          console.error('Error fetching models:', error);
          err = true;
        }
      }
    }

    if (!err) {
      const uniqueModels = Array.from(new Set(models));
      setFetchedModels(uniqueModels);
      setModelModalVisible(true);
    } else {
      showError('Failed to fetch model list');
    }
    setLoading(false);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      const localModelOptions = res.data.data.map((model) => {
        const id = (model.id || '').trim();
        return {
          key: id,
          label: id,
          value: id,
        };
      });
      setOriginModelOptions(localModelOptions);
      setFullModels(res.data.data.map((model) => model.id));
      setBasicModels(
        res.data.data
          .filter((model) => {
            return model.id.startsWith('gpt-') || model.id.startsWith('text-');
          })
          .map((model) => model.id),
      );
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

  const fetchModelGroups = async () => {
    try {
      const res = await API.get('/api/prefill_group?type=model');
      if (res?.data?.success) {
        setModelGroups(res.data.data || []);
      }
    } catch (error) {
      // ignore
    }
  };

  // 使用TwoFactorAuthModal的验证函数
  const handleVerify2FA = async () => {
    if (!verifyCode) {
      showError(t('Please enter the verification code or backup code'));
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await API.post(`/api/channel/${channelId}/key`, {
        code: verifyCode,
      });
      if (res.data.success) {
        // 验证成功，显示密钥
        updateTwoFAState({
          showModal: true,
          showKey: true,
          keyData: res.data.data.key,
        });
        reset2FAVerifyState();
        showSuccess(t('Verification successful'));
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to retrieve key'));
    } finally {
      setVerifyLoading(false);
    }
  };

  // 显示2FA验证模态框 - 使用TwoFactorAuthModal
  const handleShow2FAModal = () => {
    setShow2FAVerifyModal(true);
  };

  useEffect(() => {
    const modelMap = new Map();

    originModelOptions.forEach((option) => {
      const v = (option.value || '').trim();
      if (!modelMap.has(v)) {
        modelMap.set(v, option);
      }
    });

    inputs.models.forEach((model) => {
      const v = (model || '').trim();
      if (!modelMap.has(v)) {
        modelMap.set(v, {
          key: v,
          label: v,
          value: v,
        });
      }
    });

    const categories = getModelCategories(t);
    const optionsWithIcon = Array.from(modelMap.values()).map((opt) => {
      const modelName = opt.value;
      let icon = null;
      for (const [key, category] of Object.entries(categories)) {
        if (key !== 'all' && category.filter({ model_name: modelName })) {
          icon = category.icon;
          break;
        }
      }
      return {
        ...opt,
        label: (
          <span className='flex items-center gap-1'>
            {icon}
            {modelName}
          </span>
        ),
      };
    });

    setModelOptions(optionsWithIcon);
  }, [originModelOptions, inputs.models, t]);

  useEffect(() => {
    fetchModels().then();
    fetchGroups().then();
    if (!isEdit) {
      setInputs(originInputs);
      if (formApiRef.current) {
        formApiRef.current.setValues(originInputs);
      }
      let localModels = getChannelModels(inputs.type);
      setBasicModels(localModels);
      setInputs((inputs) => ({ ...inputs, models: localModels }));
    }
  }, [props.editingChannel.id]);

  useEffect(() => {
    if (formApiRef.current) {
      formApiRef.current.setValues(inputs);
    }
  }, [inputs]);

  useEffect(() => {
    if (props.visible) {
      if (isEdit) {
        loadChannel();
      } else {
        formApiRef.current?.setValues(getInitValues());
      }
      fetchModelGroups();
      // 重置手动输入模式状态
      setUseManualInput(false);
    } else {
      // 统一的模态框关闭重置逻辑
      resetModalState();
    }
  }, [props.visible, channelId]);

  // 统一的模态框重置函数
  const resetModalState = () => {
    formApiRef.current?.reset();
    // 重置渠道设置状态
    setChannelSettings({
      force_format: false,
      thinking_to_content: false,
      proxy: '',
      pass_through_body_enabled: false,
      system_prompt: '',
      system_prompt_override: false,
    });
    // 重置密钥模式状态
    setKeyMode('append');
    // 重置企业账户状态
    setIsEnterpriseAccount(false);
    // 清空表单中的key_mode字段
    if (formApiRef.current) {
      formApiRef.current.setValue('key_mode', undefined);
    }
    // 重置本地输入，避免下次打开残留上一次的 JSON 字段值
    setInputs(getInitValues());
    // 重置2FA状态
    resetTwoFAState();
    // 重置2FA验证状态
    reset2FAVerifyState();
  };

  const handleVertexUploadChange = ({ fileList }) => {
    vertexErroredNames.current.clear();
    (async () => {
      let validFiles = [];
      let keys = [];
      const errorNames = [];
      for (const item of fileList) {
        const fileObj = item.fileInstance;
        if (!fileObj) continue;
        try {
          const txt = await fileObj.text();
          keys.push(JSON.parse(txt));
          validFiles.push(item);
        } catch (err) {
          if (!vertexErroredNames.current.has(item.name)) {
            errorNames.push(item.name);
            vertexErroredNames.current.add(item.name);
          }
        }
      }

      // 非批量模式下只保留一个文件（最新选择的），避免重复叠加
      if (!batch && validFiles.length > 1) {
        validFiles = [validFiles[validFiles.length - 1]];
        keys = [keys[keys.length - 1]];
      }

      setVertexKeys(keys);
      setVertexFileList(validFiles);
      if (formApiRef.current) {
        formApiRef.current.setValue('vertex_files', validFiles);
      }
      setInputs((prev) => ({ ...prev, vertex_files: validFiles }));

      if (errorNames.length > 0) {
        showError(
          `The following files failed to parse and have been ignored: ${errorNames.join(', ')}`
        );
      }
    })();
  };

  const submit = async () => {
    const formValues = formApiRef.current ? formApiRef.current.getValues() : {};
    let localInputs = { ...formValues };

    if (localInputs.type === 41) {
      const keyType = localInputs.vertex_key_type || 'json';
      if (keyType === 'api_key') {
        // 直接作为普通字符串密钥处理
        if (!isEdit && (!localInputs.key || localInputs.key.trim() === '')) {
            showInfo(t('Please enter the key!'));
          return;
        }
      } else {
        // JSON 服务账号密钥
        if (useManualInput) {
          if (localInputs.key && localInputs.key.trim() !== '') {
            try {
              const parsedKey = JSON.parse(localInputs.key);
              localInputs.key = JSON.stringify(parsedKey);
            } catch (err) {
                showError(t('Invalid key format, please enter a valid JSON key'));
              return;
            }
          } else if (!isEdit) {
            showInfo(t('Please enter the key!'));
            return;
          }
        } else {
          // 文件上传模式
          let keys = vertexKeys;
          if (keys.length === 0 && vertexFileList.length > 0) {
            try {
              const parsed = await Promise.all(
                vertexFileList.map(async (item) => {
                  const fileObj = item.fileInstance;
                  if (!fileObj) return null;
                  const txt = await fileObj.text();
                  return JSON.parse(txt);
                }),
              );
              keys = parsed.filter(Boolean);
            } catch (err) {
                showError(t('Failed to parse key file: {{msg}}', { msg: err.message }));
              return;
            }
          }
          if (keys.length === 0) {
            if (!isEdit) {
                showInfo(t('Please upload the key file!'));
              return;
            } else {
              delete localInputs.key;
            }
          } else {
            localInputs.key = batch ? JSON.stringify(keys) : JSON.stringify(keys[0]);
          }
        }
      }
    }

    // 如果是编辑模式且 key 为空字符串，避免提交空值覆盖旧密钥
    if (isEdit && (!localInputs.key || localInputs.key.trim() === '')) {
      delete localInputs.key;
    }
    delete localInputs.vertex_files;

    if (!isEdit && (!localInputs.name || !localInputs.key)) {
      showInfo(t('Please enter the channel name and channel key!'));
      return;
    }
    if (!Array.isArray(localInputs.models) || localInputs.models.length === 0) {
      showInfo(t('Please select at least one model!'));
      return;
    }
    if (localInputs.type === 45 && (!localInputs.base_url || localInputs.base_url.trim() === '')) {
      showInfo(t('Please enter the API address!'));
      return;
    }
    if (
      localInputs.model_mapping &&
      localInputs.model_mapping !== '' &&
      !verifyJSON(localInputs.model_mapping)
    ) {
      showInfo(t('Model mapping must be valid JSON format!'));
      return;
    }
    if (localInputs.base_url && localInputs.base_url.endsWith('/')) {
      localInputs.base_url = localInputs.base_url.slice(
        0,
        localInputs.base_url.length - 1,
      );
    }
    if (localInputs.type === 18 && localInputs.other === '') {
      localInputs.other = 'v2.1';
    }

    // 生成渠道额外设置JSON
    const channelExtraSettings = {
      force_format: localInputs.force_format || false,
      thinking_to_content: localInputs.thinking_to_content || false,
      proxy: localInputs.proxy || '',
      pass_through_body_enabled: localInputs.pass_through_body_enabled || false,
      system_prompt: localInputs.system_prompt || '',
      system_prompt_override: localInputs.system_prompt_override || false,
    };
    localInputs.setting = JSON.stringify(channelExtraSettings);

    // 处理type === 20的企业账户设置
    if (localInputs.type === 20) {
      let settings = {};
      if (localInputs.settings) {
        try {
          settings = JSON.parse(localInputs.settings);
        } catch (error) {
            console.error('Failed to parse settings:', error);
        }
      }
      // 设置企业账户标识，无论是true还是false都要传到后端
      settings.openrouter_enterprise = localInputs.is_enterprise_account === true;
      localInputs.settings = JSON.stringify(settings);
    }

    // 清理不需要发送到后端的字段
    delete localInputs.force_format;
    delete localInputs.thinking_to_content;
    delete localInputs.proxy;
    delete localInputs.pass_through_body_enabled;
    delete localInputs.system_prompt;
    delete localInputs.system_prompt_override;
    delete localInputs.is_enterprise_account;
    // 顶层的 vertex_key_type 不应发送给后端
    delete localInputs.vertex_key_type;

    let res;
    localInputs.auto_ban = localInputs.auto_ban ? 1 : 0;
    localInputs.models = localInputs.models.join(',');
    localInputs.group = (localInputs.groups || []).join(',');

    let mode = 'single';
    if (batch) {
      mode = multiToSingle ? 'multi_to_single' : 'batch';
    }

    if (isEdit) {
      res = await API.put(`/api/channel/`, {
        ...localInputs,
        id: parseInt(channelId),
        key_mode: isMultiKeyChannel ? keyMode : undefined, // 只在多key模式下传递
      });
    } else {
      res = await API.post(`/api/channel/`, {
        mode: mode,
        multi_key_mode: mode === 'multi_to_single' ? multiKeyMode : undefined,
        channel: localInputs,
      });
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t('Channel updated successfully!'));
      } else {
        showSuccess(t('Channel created successfully!'));
        setInputs(originInputs);
      }
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
  };

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
          label: model,
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
        t('Added {{count}} new models: {{list}}', {
          count: addedModels.length,
          list: addedModels.join(', '),
        }),
      );
    } else {
      showInfo(t('No new models found'));
    }
  };

  const batchAllowed = !isEdit || isMultiKeyChannel;
  const batchExtra = batchAllowed ? (
    <Space>
      {!isEdit && (
        <Checkbox
          disabled={isEdit}
          checked={batch}
          onChange={(e) => {
            const checked = e.target.checked;

            if (!checked && vertexFileList.length > 1) {
              Modal.confirm({
                title: t('Switch to Single Key Mode'),
                content: t(
                  'Only the first key file will be kept, and the remaining files will be removed. Do you want to continue?',
                ),
                onOk: () => {
                  const firstFile = vertexFileList[0];
                  const firstKey = vertexKeys[0] ? [vertexKeys[0]] : [];

                  setVertexFileList([firstFile]);
                  setVertexKeys(firstKey);

                  formApiRef.current?.setValue('vertex_files', [firstFile]);
                  setInputs((prev) => ({ ...prev, vertex_files: [firstFile] }));

                  setBatch(false);
                  setMultiToSingle(false);
                  setMultiKeyMode('random');
                },
                onCancel: () => {
                  setBatch(true);
                },
                centered: true,
              });
              return;
            }

            setBatch(checked);
            if (!checked) {
              setMultiToSingle(false);
              setMultiKeyMode('random');
            } else {
              // In batch mode, disable manual input and clear manual input content
              setUseManualInput(false);
              if (inputs.type === 41) {
                // Clear manual key input
                if (formApiRef.current) {
                  formApiRef.current.setValue('key', '');
                }
                handleInputChange('key', '');
              }
            }
          }}
        >
          {t('Batch Create')}
        </Checkbox>
      )}
      {batch && (
        <Checkbox
          disabled={isEdit}
          checked={multiToSingle}
          onChange={() => {
            setMultiToSingle((prev) => !prev);
            setInputs((prev) => {
              const newInputs = { ...prev };
              if (!multiToSingle) {
                newInputs.multi_key_mode = multiKeyMode;
              } else {
                delete newInputs.multi_key_mode;
              }
              return newInputs;
            });
          }}
        >
          {t('Key Aggregation Mode')}
        </Checkbox>
      )}
    </Space>
  ) : null;

  const channelOptionList = useMemo(
    () =>
      CHANNEL_OPTIONS.map((opt) => ({
        ...opt,
        // 保持 label 为纯文本以支持搜索
        label: opt.label,
      })),
    [],
  );

  const renderChannelOption = (renderProps) => {
    const {
      disabled,
      selected,
      label,
      value,
      focused,
      className,
      style,
      onMouseEnter,
      onClick,
      ...rest
    } = renderProps;

    const searchWords = channelSearchValue ? [channelSearchValue] : [];

    // 构建样式类名
    const optionClassName = [
      'flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg mx-2 my-1',
      focused && 'bg-blue-50 shadow-sm',
      selected &&
        'bg-blue-100 text-blue-700 shadow-lg ring-2 ring-blue-200 ring-opacity-50',
      disabled && 'opacity-50 cursor-not-allowed',
      !disabled && 'hover:bg-gray-50 hover:shadow-md cursor-pointer',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        style={style}
        className={optionClassName}
        onClick={() => !disabled && onClick()}
        onMouseEnter={(e) => onMouseEnter()}
      >
        <div className='flex items-center gap-3 w-full'>
          <div className='flex-shrink-0 w-5 h-5 flex items-center justify-center'>
            {getChannelIcon(value)}
          </div>
          <div className='flex-1 min-w-0'>
            <Highlight
              sourceString={label}
              searchWords={searchWords}
              className='text-sm font-medium truncate'
            />
          </div>
          {selected && (
            <div className='flex-shrink-0 text-blue-600'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='currentColor'
              >
                <path d='M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z' />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <SideSheet
        placement={isEdit ? 'right' : 'left'}
        title={
          <Space>
            <Tag color='blue' shape='circle'>
              {isEdit ? t('Edit') : t('Create')}
            </Tag>
            <Title heading={4} className='m-0'>
              {isEdit ? t('Update Channel Info') : t('Create New Channel')}
            </Title>
          </Space>
        }
        bodyStyle={{ padding: '0' }}
        visible={props.visible}
        width={isMobile ? '100%' : 600}
        footer={
          <div className='flex justify-end bg-white'>
            <Space>
              <Button
                theme='solid'
                onClick={() => formApiRef.current?.submitForm()}
                icon={<IconSave />}
              >
                {t('Submit')}
              </Button>
              <Button
                theme='light'
                type='primary'
                onClick={handleCancel}
                icon={<IconClose />}
              >
                {t('Cancel')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
      >
        <Form
          key={isEdit ? 'edit' : 'new'}
          initValues={originInputs}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
        >
          {() => (
            <Spin spinning={loading}>
              <div className='p-2'>
                <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                  {/* Header: Basic Info */}
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconServer size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('Basic Info')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('Basic configuration of the channel')}
                      </div>
                    </div>
                  </div>

                  <Form.Select
                    field='type'
                    label={t('Type')}
                    placeholder={t('Please select channel type')}
                    rules={[{ required: true, message: t('Please select channel type') }]}
                    optionList={channelOptionList}
                    style={{ width: '100%' }}
                    filter={selectFilter}
                    autoClearSearchValue={false}
                    searchPosition='dropdown'
                    onSearch={(value) => setChannelSearchValue(value)}
                    renderOptionItem={renderChannelOption}
                    onChange={(value) => handleInputChange('type', value)}
                  />

                  {inputs.type === 20 && (
                    <Form.Switch
                      field='is_enterprise_account'
                      label={t('Enterprise Account')}
                      checkedText={t('Yes')}
                      uncheckedText={t('No')}
                      onChange={(value) => {
                        setIsEnterpriseAccount(value);
                        handleInputChange('is_enterprise_account', value);
                      }}
                      extraText={t('Enterprise accounts have special response formats and require special handling. If not an enterprise account, do not check this.')}
                      initValue={inputs.is_enterprise_account}
                    />
                  )}

                  <Form.Input
                    field='name'
                    label={t('Name')}
                    placeholder={t('Please name the channel')}
                    rules={[{ required: true, message: t('Please name the channel') }]}
                    showClear
                    onChange={(value) => handleInputChange('name', value)}
                    autoComplete='new-password'
                  />

                  {inputs.type === 41 && (
                    <Form.Select
                      field='vertex_key_type'
                      label={t('Key Format')}
                      placeholder={t('Please select key format')}
                      optionList={[
                        { label: 'JSON', value: 'json' },
                        { label: 'API Key', value: 'api_key' },
                      ]}
                      style={{ width: '100%' }}
                      value={inputs.vertex_key_type || 'json'}
                      onChange={(value) => {
                        handleChannelOtherSettingsChange('vertex_key_type', value);
                        if (value === 'api_key') {
                          setBatch(false);
                          setUseManualInput(false);
                          setVertexKeys([]);
                          setVertexFileList([]);
                          if (formApiRef.current) {
                            formApiRef.current.setValue('vertex_files', []);
                          }
                        }
                      }}
                      extraText={
                        inputs.vertex_key_type === 'api_key'
                          ? t('Batch creation is not supported in API Key mode')
                          : t('JSON mode supports manual input or uploading service account JSON')
                      }
                    />
                  )}
                  {batch ? (
                    inputs.type === 41 && (inputs.vertex_key_type || 'json') === 'json' ? (
                      <Form.Upload
                        field='vertex_files'
                        label={t('Key File (.json)')}
                        accept='.json'
                        multiple
                        draggable
                        dragIcon={<IconBolt />}
                        dragMainText={t('Click to upload or drag files here')}
                        dragSubText={t('Only JSON files are supported, multiple files allowed')}
                        style={{ marginTop: 10 }}
                        uploadTrigger='custom'
                        beforeUpload={() => false}
                        onChange={handleVertexUploadChange}
                        fileList={vertexFileList}
                        rules={
                          isEdit
                            ? []
                            : [{ required: true, message: t('Please upload key file') }]
                        }
                        extraText={batchExtra}
                      />
                    ) : (
                      <Form.TextArea
                        field='key'
                        label={t('Key')}
                        placeholder={t('Please enter key, one per line')}
                        rules={
                          isEdit
                            ? []
                            : [{ required: true, message: t('Please enter key') }]
                        }
                        autosize
                        autoComplete='new-password'
                        onChange={(value) => handleInputChange('key', value)}
                        extraText={
                          <div className='flex items-center gap-2'>
                            {isEdit &&
                              isMultiKeyChannel &&
                              keyMode === 'append' && (
                                <Text type='warning' size='small'>
                                  {t('Append mode: new keys will be added to the end of the existing key list')}
                                </Text>
                              )}
                            {isEdit && (
                              <Button
                                size='small'
                                type='primary'
                                theme='outline'
                                onClick={handleShow2FAModal}
                              >
                                {t('View Key')}
                              </Button>
                            )}
                            {batchExtra}
                          </div>
                        }
                        showClear
                      />
                    )
                  ) : (
                    <>
                      {inputs.type === 41 && (inputs.vertex_key_type || 'json') === 'json' ? (
                        <>
                          {!batch && (
                            <div className='flex items-center justify-between mb-3'>
                              <Text className='text-sm font-medium'>
                                {t('Key Input Method')}
                              </Text>
                              <Space>
                                <Button
                                  size='small'
                                  type={
                                    !useManualInput ? 'primary' : 'tertiary'
                                  }
                                  onClick={() => {
                                    setUseManualInput(false);
                                    if (formApiRef.current) {
                                      formApiRef.current.setValue('key', '');
                                    }
                                    handleInputChange('key', '');
                                  }}
                                >
                                  {t('File Upload')}
                                </Button>
                                <Button
                                  size='small'
                                  type={useManualInput ? 'primary' : 'tertiary'}
                                  onClick={() => {
                                    setUseManualInput(true);
                                    setVertexKeys([]);
                                    setVertexFileList([]);
                                    if (formApiRef.current) {
                                      formApiRef.current.setValue(
                                        'vertex_files',
                                        [],
                                      );
                                    }
                                    setInputs((prev) => ({
                                      ...prev,
                                      vertex_files: [],
                                    }));
                                  }}
                                >
                                  {t('Manual Input')}
                                </Button>
                              </Space>
                            </div>
                          )}

                          {batch && (
                            <Banner
                              type='info'
                              description={t(
                                'Batch creation only supports file upload, manual input is not supported',
                              )}
                              className='!rounded-lg mb-3'
                            />
                          )}

                          {useManualInput && !batch ? (
                            <Form.TextArea
                              field='key'
                              label={
                                isEdit
                                  ? t('Key (not displayed in edit mode)')
                                  : t('Key')
                              }
                              placeholder={t(
                                'Please enter the JSON key content, e.g.:\n{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key_id": "...",\n  "private_key": "...",\n  "client_email": "...",\n  "client_id": "...",\n  "auth_uri": "...",\n  "token_uri": "...",\n  "auth_provider_x509_cert_url": "...",\n  "client_x509_cert_url": "..."\n}',
                              )}
                              rules={
                                isEdit
                                  ? []
                                  : [
                                      {
                                        required: true,
                                        message: t('Please enter key'),
                                      },
                                    ]
                              }
                              autoComplete='new-password'
                              onChange={(value) =>
                                handleInputChange('key', value)
                              }
                              extraText={
                                <div className='flex items-center gap-2'>
                                  <Text type='tertiary' size='small'>
                                    {t('Please enter complete JSON key content')}
                                  </Text>
                                  {isEdit &&
                                    isMultiKeyChannel &&
                                    keyMode === 'append' && (
                                      <Text type='warning' size='small'>
                                        {t('Append mode: new keys will be added to the end of the existing key list')}
                                      </Text>
                                    )}
                                  {isEdit && (
                                    <Button
                                      size='small'
                                      type='primary'
                                      theme='outline'
                                      onClick={handleShow2FAModal}
                                    >
                                      {t('View Key')}
                                    </Button>
                                  )}
                                  {batchExtra}
                                </div>
                              }
                              autosize
                              showClear
                            />
                          ) : (
                            <Form.Upload
                              field='vertex_files'
                              label={t('Key File (.json)')}
                              accept='.json'
                              draggable
                              dragIcon={<IconBolt />}
                              dragMainText={t('Click to upload or drag files here')}
                              dragSubText={t('Only JSON files are supported')}
                              style={{ marginTop: 10 }}
                              uploadTrigger='custom'
                              beforeUpload={() => false}
                              onChange={handleVertexUploadChange}
                              fileList={vertexFileList}
                              rules={
                                isEdit
                                  ? []
                                  : [
                                      {
                                        required: true,
                                        message: t('Please upload key file'),
                                      },
                                    ]
                              }
                              extraText={batchExtra}
                            />
                          )}
                        </>
                      ) : (
                        <Form.Input
                          field='key'
                          label={
                            isEdit
                              ? t('Key (not displayed in edit mode)')
                              : t('Key')
                          }
                          placeholder={t(type2secretPrompt(inputs.type))}
                          rules={
                            isEdit
                              ? []
                              : [{ required: true, message: t('Please enter key') }]
                          }
                          autoComplete='new-password'
                          onChange={(value) => handleInputChange('key', value)}
                          extraText={
                            <div className='flex items-center gap-2'>
                              {isEdit &&
                                isMultiKeyChannel &&
                                keyMode === 'append' && (
                                  <Text type='warning' size='small'>
                                    {t('Append mode: new keys will be added to the end of the existing key list')}
                                  </Text>
                                )}
                              {isEdit && (
                                <Button
                                  size='small'
                                  type='primary'
                                  theme='outline'
                                  onClick={handleShow2FAModal}
                                >
                                  {t('View Key')}
                                </Button>
                              )}
                              {batchExtra}
                            </div>
                          }
                          showClear
                        />
                      )}
                    </>
                  )}

                  {isEdit && isMultiKeyChannel && (
                    <Form.Select
                      field='key_mode'
                      label={t('Key Update Mode')}
                      placeholder={t('Please select key update mode')}
                      optionList={[
                        { label: t('Append to existing keys'), value: 'append' },
                        { label: t('Replace existing keys'), value: 'replace' },
                      ]}
                      style={{ width: '100%' }}
                      value={keyMode}
                      onChange={(value) => setKeyMode(value)}
                      extraText={
                        <Text type='tertiary' size='small'>
                          {keyMode === 'replace'
                            ? t('Replace mode: will completely replace all existing keys')
                            : t('Append mode: will add new keys to the end of the existing key list')}
                        </Text>
                      }
                    />
                  )}
                  {batch && multiToSingle && (
                    <>
                      <Form.Select
                        field='multi_key_mode'
                        label={t('Key Aggregation Mode')}
                        placeholder={t('Please select multi-key strategy')}
                        optionList={[
                          { label: t('Random'), value: 'random' },
                          { label: t('Polling'), value: 'polling' },
                        ]}
                        style={{ width: '100%' }}
                        value={inputs.multi_key_mode || 'random'}
                        onChange={(value) => {
                          setMultiKeyMode(value);
                          handleInputChange('multi_key_mode', value);
                        }}
                      />
                      {inputs.multi_key_mode === 'polling' && (
                        <Banner
                          type='warning'
                          description={t(
                            'Polling mode requires Redis and memory cache enabled, otherwise performance will be greatly reduced and polling will not work',
                          )}
                          className='!rounded-lg mt-2'
                        />
                      )}
                    </>
                  )}

                  {inputs.type === 18 && (
                    <Form.Input
                      field='other'
                      label={t('Model Version')}
                      placeholder={'Please enter Spark model version, e.g.: v2.1'}
                      onChange={(value) => handleInputChange('other', value)}
                      showClear
                    />
                  )}

                  {inputs.type === 41 && (
                    <JSONEditor
                      key={`region-${isEdit ? channelId : 'new'}`}
                      field='other'
                      label={t('Deployment Region')}
                      placeholder={t(
                        'Please enter deployment region, e.g.: us-central1\nSupports model mapping format\n{\n    "default": "us-central1",\n    "claude-3-5-sonnet-20240620": "europe-west1"\n}',
                      )}
                      value={inputs.other || ''}
                      onChange={(value) => handleInputChange('other', value)}
                      rules={[{ required: true, message: t('Please enter deployment region') }]}
                      template={REGION_EXAMPLE}
                      templateLabel={t('Fill Template')}
                      editorType='region'
                      formApi={formApiRef.current}
                      extraText={t('Set default region and dedicated region for specific models')}
                    />
                  )}

                  {inputs.type === 21 && (
                    <Form.Input
                      field='other'
                      label={t('Knowledge Base ID')}
                      placeholder={'Please enter Knowledge Base ID, e.g.: 123456'}
                      onChange={(value) => handleInputChange('other', value)}
                      showClear
                    />
                  )}

                  {inputs.type === 39 && (
                    <Form.Input
                      field='other'
                      label='Account ID'
                      placeholder={
                        'Please enter Account ID, e.g.: d6b5da8hk1awo8nap34ube6gh'
                      }
                      onChange={(value) => handleInputChange('other', value)}
                      showClear
                    />
                  )}

                  {inputs.type === 49 && (
                    <Form.Input
                      field='other'
                      label={t('Agent ID')}
                      placeholder={'Please enter Agent ID, e.g.: 7342866812345'}
                      onChange={(value) => handleInputChange('other', value)}
                      showClear
                    />
                  )}

                  {inputs.type === 1 && (
                    <Form.Input
                      field='openai_organization'
                      label={t('Organization')}
                      placeholder={t('Please enter organization org-xxx')}
                      showClear
                      helpText={t('Organization, leave blank for default')}
                      onChange={(value) =>
                        handleInputChange('openai_organization', value)
                      }
                    />
                  )}
                </Card>

                {/* API Configuration Card */}
                {showApiConfigCard && (
                  <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                    {/* Header: API Config */}
                    <div className='flex items-center mb-2'>
                      <Avatar
                        size='small'
                        color='green'
                        className='mr-2 shadow-md'
                      >
                        <IconGlobe size={16} />
                      </Avatar>
                      <div>
                        <Text className='text-lg font-medium'>
                          {t('API Config')}
                        </Text>
                        <div className='text-xs text-gray-600'>
                          {t('API address and related configuration')}
                        </div>
                      </div>
                    </div>

                    {inputs.type === 40 && (
                      <Banner
                        type='info'
                        description={
                          <div>
                            <Text strong>{t('Invitation Link')}:</Text>
                            <Text
                              link
                              underline
                              className='ml-2 cursor-pointer'
                              onClick={() =>
                                window.open(
                                  'https://cloud.siliconflow.cn/i/hij0YNTZ',
                                )
                              }
                            >
                              https://cloud.siliconflow.cn/i/hij0YNTZ
                            </Text>
                          </div>
                        }
                        className='!rounded-lg'
                      />
                    )}

                    {inputs.type === 3 && (
                      <>
                        <Banner
                          type='warning'
                          description={t(
                            'For channels added after May 10, 2025, you do not need to remove "." from the model name during deployment.',
                          )}
                          className='!rounded-lg'
                        />
                        <div>
                          <Form.Input
                            field='base_url'
                            label='AZURE_OPENAI_ENDPOINT'
                            placeholder={t(
                              'Please enter AZURE_OPENAI_ENDPOINT, e.g.: https://docs-test-001.openai.azure.com',
                            )}
                            onChange={(value) =>
                              handleInputChange('base_url', value)
                            }
                            showClear
                          />
                        </div>
                        <div>
                          <Form.Input
                            field='other'
                            label={t('Default API Version')}
                            placeholder={t(
                              'Please enter default API version, e.g.: 2025-04-01-preview',
                            )}
                            onChange={(value) =>
                              handleInputChange('other', value)
                            }
                            showClear
                          />
                        </div>
                        <div>
                          <Form.Input
                            field='azure_responses_version'
                            label={t(
                              'Default Responses API Version, leave blank to use above version',
                            )}
                            placeholder={t('e.g.: preview')}
                            onChange={(value) =>
                              handleChannelOtherSettingsChange(
                                'azure_responses_version',
                                value,
                              )
                            }
                            showClear
                          />
                        </div>
                      </>
                    )}

                    {inputs.type === 8 && (
                      <>
                        <Banner
                          type='warning'
                          description={t(
                            'If you are connecting to upstream One API or New API forwarding projects, please use OpenAI type. Do not use this type unless you know what you are doing.',
                          )}
                          className='!rounded-lg'
                        />
                        <div>
                          <Form.Input
                            field='base_url'
                            label={t('Full Base URL, supports variable {model}')}
                            placeholder={t(
                              'Please enter full URL, e.g.: https://api.openai.com/v1/chat/completions',
                            )}
                            onChange={(value) =>
                              handleInputChange('base_url', value)
                            }
                            showClear
                          />
                        </div>
                      </>
                    )}

                    {inputs.type === 37 && (
                      <Banner
                        type='warning'
                        description={t(
                          'Dify channel only supports chatflow and agent, and agent does not support images!',
                        )}
                        className='!rounded-lg'
                      />
                    )}

                    {inputs.type !== 3 &&
                      inputs.type !== 8 &&
                      inputs.type !== 22 &&
                      inputs.type !== 36 &&
                      inputs.type !== 45 && (
                        <div>
                          <Form.Input
                            field='base_url'
                            label={t('API Address')}
                            placeholder={t(
                              'Optional, for custom API address calls. Do not end with /v1 or /',
                            )}
                            onChange={(value) =>
                              handleInputChange('base_url', value)
                            }
                            showClear
                            extraText={t(
                              'For official channels, new-api has built-in addresses. Unless it is a third-party proxy site or Azure special access address, you do not need to fill in.',
                            )}
                          />
                        </div>
                      )}

                    {inputs.type === 22 && (
                      <div>
                        <Form.Input
                          field='base_url'
                          label={t('Private Deployment Address')}
                          placeholder={t(
                            'Please enter private deployment address, format: https://fastgpt.run/api/openapi',
                          )}
                          onChange={(value) =>
                            handleInputChange('base_url', value)
                          }
                          showClear
                        />
                      </div>
                    )}

                    {inputs.type === 36 && (
                      <div>
                        <Form.Input
                          field='base_url'
                          label={t(
                            'Note: Not Chat API, please fill in the correct API address, otherwise it may not work',
                          )}
                          placeholder={t(
                            'Please enter the path before /suno, usually just the domain, e.g.: https://api.example.com',
                          )}
                          onChange={(value) =>
                            handleInputChange('base_url', value)
                          }
                          showClear
                        />
                      </div>
                    )}

                    {inputs.type === 45 && (
                        <div>
                          <Form.Select
                              field='base_url'
                              label={t('API Address')}
                              placeholder={t('Please select API address')}
                              onChange={(value) =>
                                  handleInputChange('base_url', value)
                              }
                              optionList={[
                                {
                                  value: 'https://ark.cn-beijing.volces.com',
                                  label: 'https://ark.cn-beijing.volces.com'
                                },
                                {
                                  value: 'https://ark.ap-southeast.bytepluses.com',
                                  label: 'https://ark.ap-southeast.bytepluses.com'
                                }
                              ]}
                              defaultValue='https://ark.cn-beijing.volces.com'
                          />
                        </div>
                    )}
                  </Card>
                )}

                {/* Model Configuration Card */}
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
                      <Text className='text-lg font-medium'>
                        {t('Model Config')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('Model selection and mapping settings')}
                      </div>
                    </div>
                  </div>

                  <Form.Select
                    field='models'
                    label={t('Models')}
                    placeholder={t('Please select supported models for this channel')}
                    rules={[{ required: true, message: t('Please select models') }]}
                    multiple
                    filter={selectFilter}
                    autoClearSearchValue={false}
                    searchPosition='dropdown'
                    optionList={modelOptions}
                    style={{ width: '100%' }}
                    onChange={(value) => handleInputChange('models', value)}
                    renderSelectedItem={(optionNode) => {
                      const modelName = String(optionNode?.value ?? '');
                      return {
                        isRenderInTag: true,
                        content: (
                          <span
                            className='cursor-pointer select-none'
                            role='button'
                            tabIndex={0}
                            title={t('Click to copy model name')}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await copy(modelName);
                              if (ok) {
                                showSuccess(
                                  t('Copied: {{name}}', { name: modelName }),
                                );
                              } else {
                                showError(t('Copy failed'));
                              }
                            }}
                          >
                            {optionNode.label || modelName}
                          </span>
                        ),
                      };
                    }}
                    extraText={
                      <Space wrap>
                        <Button
                          size='small'
                          type='primary'
                          onClick={() =>
                            handleInputChange('models', basicModels)
                          }
                        >
                          {t('Fill related models')}
                        </Button>
                        <Button
                          size='small'
                          type='secondary'
                          onClick={() =>
                            handleInputChange('models', fullModels)
                          }
                        >
                          {t('Fill all models')}
                        </Button>
                        {MODEL_FETCHABLE_TYPES.has(inputs.type) && (
                          <Button
                            size='small'
                            type='tertiary'
                            onClick={() => fetchUpstreamModelList('models')}
                          >
                            {t('Fetch model list')}
                          </Button>
                        )}
                        <Button
                          size='small'
                          type='warning'
                          onClick={() => handleInputChange('models', [])}
                        >
                          {t('Clear all models')}
                        </Button>
                        <Button
                          size='small'
                          type='tertiary'
                          onClick={() => {
                            if (inputs.models.length === 0) {
                              showInfo(t('No models to copy'));
                              return;
                            }
                            try {
                              copy(inputs.models.join(','));
                              showSuccess(t('Model list copied to clipboard'));
                            } catch (error) {
                              showError(t('Copy failed'));
                            }
                          }}
                        >
                          {t('Copy all models')}
                        </Button>
                        {modelGroups &&
                          modelGroups.length > 0 &&
                          modelGroups.map((group) => (
                            <Button
                              key={group.id}
                              size='small'
                              type='primary'
                              onClick={() => {
                                let items = [];
                                try {
                                  if (Array.isArray(group.items)) {
                                    items = group.items;
                                  } else if (typeof group.items === 'string') {
                                    const parsed = JSON.parse(
                                      group.items || '[]',
                                    );
                                    if (Array.isArray(parsed)) items = parsed;
                                  }
                                } catch {}
                                const current =
                                  formApiRef.current?.getValue('models') ||
                                  inputs.models ||
                                  [];
                                const merged = Array.from(
                                  new Set(
                                    [...current, ...items]
                                      .map((m) => (m || '').trim())
                                      .filter(Boolean),
                                  ),
                                );
                                handleInputChange('models', merged);
                              }}
                            >
                              {group.name}
                            </Button>
                          ))}
                      </Space>
                    }
                  />

                  <Form.Input
                    field='custom_model'
                    label={t('Custom Model Name')}
                    placeholder={t('Enter custom model name')}
                    onChange={(value) => setCustomModel(value.trim())}
                    value={customModel}
                    suffix={
                      <Button
                        size='small'
                        type='primary'
                        onClick={addCustomModels}
                      >
                        {t('Fill')}
                      </Button>
                    }
                  />

                  <Form.Input
                    field='test_model'
                    label={t('Default Test Model')}
                    placeholder={t('Leave blank to use the first model in the list')}
                    onChange={(value) => handleInputChange('test_model', value)}
                    showClear
                  />

                  <JSONEditor
                    key={`model_mapping-${isEdit ? channelId : 'new'}`}
                    field='model_mapping'
                    label={t('Model Redirection')}
                    placeholder={
                      t(
                        'Optional, used to modify the model name in the request body. It should be a JSON string, key is the model name in the request, value is the model name to replace, e.g.:',
                      ) + `\n${JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)}`
                    }
                    value={inputs.model_mapping || ''}
                    onChange={(value) =>
                      handleInputChange('model_mapping', value)
                    }
                    template={MODEL_MAPPING_EXAMPLE}
                    templateLabel={t('Fill Template')}
                    editorType='keyValue'
                    formApi={formApiRef.current}
                    extraText={t('Key is the model name in the request, value is the model name to replace')}
                  />
                </Card>

                {/* Advanced Settings Card */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                  {/* Header: Advanced Settings */}
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='orange'
                      className='mr-2 shadow-md'
                    >
                      <IconSetting size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('Advanced Settings')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('Advanced configuration options for the channel')}
                      </div>
                    </div>
                  </div>

                  <Form.Select
                    field='groups'
                    label={t('Groups')}
                    placeholder={t('Please select groups that can use this channel')}
                    multiple
                    allowAdditions
                    additionLabel={t(
                      'Please edit group weights in the system settings page to add new groups:',
                    )}
                    optionList={groupOptions}
                    style={{ width: '100%' }}
                    onChange={(value) => handleInputChange('groups', value)}
                  />

                  <Form.Input
                    field='tag'
                    label={t('Channel Tag')}
                    placeholder={t('Channel Tag')}
                    showClear
                    onChange={(value) => handleInputChange('tag', value)}
                  />
                  <Form.TextArea
                    field='remark'
                    label={t('Remark')}
                    placeholder={t('Please enter remark (visible to admins only)')}
                    maxLength={255}
                    showClear
                    onChange={(value) => handleInputChange('remark', value)}
                  />

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.InputNumber
                        field='priority'
                        label={t('Channel Priority')}
                        placeholder={t('Channel Priority')}
                        min={0}
                        onNumberChange={(value) =>
                          handleInputChange('priority', value)
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Form.InputNumber
                        field='weight'
                        label={t('Channel Weight')}
                        placeholder={t('Channel Weight')}
                        min={0}
                        onNumberChange={(value) =>
                          handleInputChange('weight', value)
                        }
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  <Form.Switch
                    field='auto_ban'
                    label={t('Auto Disable')}
                    checkedText={t('On')}
                    uncheckedText={t('Off')}
                    onChange={(value) => setAutoBan(value)}
                    extraText={t(
                      'Effective only when auto disable is enabled. If off, the channel will not be automatically disabled.',
                    )}
                    initValue={autoBan}
                  />

                  <Form.TextArea
                    field='param_override'
                    label={t('Parameter Override')}
                    placeholder={
                      t('Optional, used to override request parameters. Does not support overriding stream parameter') +
                      '\n' +
                      t('Old format (direct override):') +
                      '\n{\n  "temperature": 0,\n  "max_tokens": 1000\n}' +
                      '\n\n' +
                      t('New format (supports conditions and custom JSON):') +
                      '\n{\n  "operations": [\n    {\n      "path": "temperature",\n      "mode": "set",\n      "value": 0.7,\n      "conditions": [\n        {\n          "path": "model",\n          "mode": "prefix",\n          "value": "gpt"\n        }\n      ]\n    }\n  ]\n}'
                    }
                    autosize
                    onChange={(value) =>
                      handleInputChange('param_override', value)
                    }
                    extraText={
                      <div className='flex gap-2 flex-wrap'>
                        <Text
                          className='!text-semi-color-primary cursor-pointer'
                          onClick={() =>
                            handleInputChange(
                              'param_override',
                              JSON.stringify({ temperature: 0 }, null, 2),
                            )
                          }
                        >
                          {t('Old Format Template')}
                        </Text>
                        <Text
                          className='!text-semi-color-primary cursor-pointer'
                          onClick={() =>
                            handleInputChange(
                              'param_override',
                              JSON.stringify(
                                {
                                  operations: [
                                    {
                                      path: 'temperature',
                                      mode: 'set',
                                      value: 0.7,
                                      conditions: [
                                        {
                                          path: 'model',
                                          mode: 'prefix',
                                          value: 'gpt',
                                        },
                                      ],
                                      logic: 'AND',
                                    },
                                  ],
                                },
                                null,
                                2,
                              ),
                            )
                          }
                        >
                          {t('New Format Template')}
                        </Text>
                      </div>
                    }
                    showClear
                  />

                  <Form.TextArea
                    field='header_override'
                    label={t('Header Override')}
                    placeholder={
                      t('Optional, used to override request headers') +
                      '\n' +
                      t('Format example:') +
                      '\n{\n  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"\n}'
                    }
                    autosize
                    onChange={(value) =>
                      handleInputChange('header_override', value)
                    }
                    extraText={
                      <div className='flex gap-2 flex-wrap'>
                        <Text
                          className='!text-semi-color-primary cursor-pointer'
                          onClick={() =>
                            handleInputChange(
                              'header_override',
                              JSON.stringify(
                                {
                                  'User-Agent':
                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',
                                },
                                null,
                                2,
                              ),
                            )
                          }
                        >
                          {t('Format Template')}
                        </Text>
                      </div>
                    }
                    showClear
                  />

                  <JSONEditor
                    key={`status_code_mapping-${isEdit ? channelId : 'new'}`}
                    field='status_code_mapping'
                    label={t('Status Code Rewrite')}
                    placeholder={
                      t(
                        'Optional, used to rewrite returned status codes. Only affects local judgment, does not modify status code returned to upstream. For example, rewrite Claude channel 400 error to 500 (for retry). Do not abuse this feature. Example:',
                      ) +
                      '\n' +
                      JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2)
                    }
                    value={inputs.status_code_mapping || ''}
                    onChange={(value) =>
                      handleInputChange('status_code_mapping', value)
                    }
                    template={STATUS_CODE_MAPPING_EXAMPLE}
                    templateLabel={t('Fill Template')}
                    editorType='keyValue'
                    formApi={formApiRef.current}
                    extraText={t(
                      'Key is original status code, value is the status code to rewrite. Only affects local judgment.',
                    )}
                  />
                </Card>

                {/* Channel Extra Settings Card */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                  {/* Header: Channel Extra Settings */}
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='violet'
                      className='mr-2 shadow-md'
                    >
                      <IconBolt size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('Channel Extra Settings')}
                      </Text>
                    </div>
                  </div>

                  {inputs.type === 1 && (
                    <Form.Switch
                      field='force_format'
                      label={t('Force Format')}
                      checkedText={t('On')}
                      uncheckedText={t('Off')}
                      onChange={(value) =>
                        handleChannelSettingsChange('force_format', value)
                      }
                      extraText={t(
                        'Force response to OpenAI standard format (only for OpenAI channel type)',
                      )}
                    />
                  )}

                  <Form.Switch
                    field='thinking_to_content'
                    label={t('Reasoning Content Conversion')}
                    checkedText={t('On')}
                    uncheckedText={t('Off')}
                    onChange={(value) =>
                      handleChannelSettingsChange('thinking_to_content', value)
                    }
                    extraText={t(
                      'Convert reasoning_content to <think> tag and append to content',
                    )}
                  />

                  <Form.Switch
                    field='pass_through_body_enabled'
                    label={t('Pass-through Request Body')}
                    checkedText={t('On')}
                    uncheckedText={t('Off')}
                    onChange={(value) =>
                      handleChannelSettingsChange(
                        'pass_through_body_enabled',
                        value,
                      )
                    }
                    extraText={t('Enable request body pass-through')}
                  />

                  <Form.Input
                    field='proxy'
                    label={t('Proxy Address')}
                    placeholder={t('e.g.: socks5://user:pass@host:port')}
                    onChange={(value) =>
                      handleChannelSettingsChange('proxy', value)
                    }
                    showClear
                    extraText={t('Configure network proxy, supports socks5 protocol')}
                  />

                  <Form.TextArea
                    field='system_prompt'
                    label={t('System Prompt')}
                    placeholder={t(
                      'Enter system prompt. User system prompt will take precedence over this setting.',
                    )}
                    onChange={(value) =>
                      handleChannelSettingsChange('system_prompt', value)
                    }
                    autosize
                    showClear
                    extraText={t(
                      'User priority: If user specifies system prompt in request, user setting will be used first.',
                    )}
                  />
                  <Form.Switch
                    field='system_prompt_override'
                    label={t('System Prompt Prepend')}
                    checkedText={t('On')}
                    uncheckedText={t('Off')}
                    onChange={(value) =>
                      handleChannelSettingsChange(
                        'system_prompt_override',
                        value,
                      )
                    }
                    extraText={t(
                      'If user request contains system prompt, this setting will be prepended to user system prompt.',
                    )}
                  />
                </Card>
              </div>
            </Spin>
          )}
        </Form>
        <ImagePreview
          src={modalImageUrl}
          visible={isModalOpenurl}
          onVisibleChange={(visible) => setIsModalOpenurl(visible)}
        />
      </SideSheet>
      {/* Use TwoFactorAuthModal component for 2FA verification */}
        <TwoFactorAuthModal
          visible={show2FAVerifyModal}
          code={verifyCode}
          loading={verifyLoading}
          onCodeChange={setVerifyCode}
          onVerify={handleVerify2FA}
          onCancel={reset2FAVerifyState}
          title={t('View Channel Key')}
          description={t('To protect your account security, please verify your two-factor authentication code.')}
          placeholder={t('Please enter your verification code or backup code')}
        />

        {/* Use ChannelKeyDisplay component to show the key */}
        <Modal
          title={
            <div className='flex items-center'>
          <div className='w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3'>
            <svg
              className='w-4 h-4 text-green-600 dark:text-green-400'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
            fillRule='evenodd'
            d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
            clipRule='evenodd'
              />
            </svg>
          </div>
          {t('Channel Key Information')}
            </div>
          }
          visible={twoFAState.showModal && twoFAState.showKey}
          onCancel={resetTwoFAState}
          footer={
            <Button type='primary' onClick={resetTwoFAState}>
          {t('Done')}
            </Button>
          }
          width={700}
          style={{ maxWidth: '90vw' }}
        >
          <ChannelKeyDisplay
            keyData={twoFAState.keyData}
            showSuccessIcon={true}
            successText={t('Key retrieved successfully')}
            showWarning={true}
            warningText={t(
          'Please keep your key information safe and do not share it with others. If you have any security concerns, please change your key promptly.',
            )}
          />
        </Modal>

        <ModelSelectModal
          visible={modelModalVisible}
          models={fetchedModels}
          selected={inputs.models}
          onConfirm={(selectedModels) => {
          handleInputChange('models', selectedModels);
            showSuccess(t('Model list updated'));
          setModelModalVisible(false);
        }}
        onCancel={() => setModelModalVisible(false)}
      />
    </>
  );
};

export default EditChannelModal;