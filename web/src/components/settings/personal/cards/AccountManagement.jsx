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
import {
  Button,
  Card,
  Input,
  Space,
  Typography,
  Avatar,
  Tabs,
  TabPane,
  Popover,
} from '@douyinfe/semi-ui';
import { Select } from '@douyinfe/semi-ui';
import {
  IconMail,
  IconShield,
  IconGithubLogo,
  IconKey,
  IconLock,
  IconDelete,
} from '@douyinfe/semi-icons';
import { SiTelegram, SiWechat, SiLinux } from 'react-icons/si';
import { UserPlus, ShieldCheck } from 'lucide-react';
import TelegramLoginButton from 'react-telegram-login';
import {
  onGitHubOAuthClicked,
  onOIDCClicked,
  onLinuxDOOAuthClicked,
} from '../../../../helpers';
import TwoFASetting from '../components/TwoFASetting';

import { useState } from 'react';

const AccountManagement = ({
  t,
  userState,
  status,
  systemToken,
  setShowEmailBindModal,
  setShowWeChatBindModal,
  generateAccessToken,
  handleSystemTokenClick,
  setShowChangePasswordModal,
  setShowAccountDeleteModal,
  onUpdateProfile, // Optional: callback for updating profile fields
}) => {
  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CN', label: 'China' },
    { value: 'IN', label: 'India' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'KR', label: 'South Korea' },
    { value: 'CA', label: 'Canada' },
    { value: 'BR', label: 'Brazil' },
    { value: 'RU', label: 'Russia' },
    { value: 'AU', label: 'Australia' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'SG', label: 'Singapore' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'MX', label: 'Mexico' },
    { value: 'TR', label: 'Turkey' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'AR', label: 'Argentina' },
    // ...add more as needed
  ];
  // Modal state for editing all profile fields together
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: userState.user?.full_name || '',
    address_line1: userState.user?.address_line1 || '',
    address_postal_code: userState.user?.address_postal_code || '',
    address_city: userState.user?.address_city || '',
    address_state: userState.user?.address_state || '',
    address_country: userState.user?.address_country || '',
    country_code: userState.user?.country_code || '',
    phone: userState.user?.phone || '',
  });

  const handleEditClick = () => {
    setEditForm({
      full_name: userState.user?.full_name || '',
      address_line1: userState.user?.address_line1 || '',
      address_postal_code: userState.user?.address_postal_code || '',
      address_city: userState.user?.address_city || '',
      address_state: userState.user?.address_state || '',
      address_country: userState.user?.address_country || '',
      country_code: userState.user?.country_code || '',
      phone: userState.user?.phone || '',
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = () => {
    if (onUpdateProfile) {
      onUpdateProfile('full_name', editForm.full_name);
      onUpdateProfile('address_line1', editForm.address_line1);
      onUpdateProfile('address_postal_code', editForm.address_postal_code);
      onUpdateProfile('address_city', editForm.address_city);
      onUpdateProfile('address_state', editForm.address_state);
      onUpdateProfile('country_code', editForm.country_code);
      onUpdateProfile('phone', editForm.phone);
    }
    setShowEditModal(false);
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
  };
  const renderAccountInfo = (accountId, label) => {
    if (!accountId || accountId === '') {
      return <span className='text-gray-500'>{t('未绑定')}</span>;
    }

    const popContent = (
      <div className='text-xs p-2'>
        <Typography.Paragraph copyable={{ content: accountId }}>
          {accountId}
        </Typography.Paragraph>
        {label ? (
          <div className='mt-1 text-[11px] text-gray-500'>{label}</div>
        ) : null}
      </div>
    );

    return (
      <Popover content={popContent} position='top' trigger='hover'>
        <span className='block max-w-full truncate text-gray-600 hover:text-blue-600 cursor-pointer'>
          {accountId}
        </span>
      </Popover>
    );
  };
  return (
    <Card className='!rounded-2xl'>
      {/* Card Header */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='teal' className='mr-3 shadow-md'>
          <UserPlus size={16} />
        </Avatar>
        <div>
          <Typography.Text className='text-lg font-medium'>
            {t('Account Management')}
          </Typography.Text>
          <div className='text-xs text-gray-600'>
            {t('Account binding, security settings, and authentication')}
          </div>
        </div>
      </div>

      <Tabs type='card' defaultActiveKey='binding'>
        {/* Single Edit Modal for all profile fields */}
        {showEditModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30'>
            <Card className='w-[400px] !rounded-xl'>
              <Typography.Title heading={6} className='mb-2'>
                {t('Edit Profile')}
              </Typography.Title>
              <Space vertical className='w-full'>
                <Input
                  value={editForm.full_name}
                  onChange={v => handleEditFormChange('full_name', v)}
                  placeholder={t('Full Name')}
                  size='large'
                  label={t('Full Name')}
                  className='mb-2'
                />
                <Input
                  value={editForm.address_line1}
                  onChange={v => handleEditFormChange('address_line1', v)}
                  placeholder={t('Street Address')}
                  size='large'
                  label={t('Street Address')}
                  className='mb-2'
                />
                <Input
                  value={editForm.address_postal_code}
                  onChange={v => handleEditFormChange('address_postal_code', v)}
                  placeholder={t('Postal Code')}
                  size='large'
                  label={t('Postal Code')}
                  className='mb-2'
                />
                <Input
                  value={editForm.address_city}
                  onChange={v => handleEditFormChange('address_city', v)}
                  placeholder={t('City')}
                  size='large'
                  label={t('City')}
                  className='mb-2'
                />
                <Input
                  value={editForm.address_state}
                  onChange={v => handleEditFormChange('address_state', v)}
                  placeholder={t('State')}
                  size='large'
                  label={t('State')}
                  className='mb-2'
                />
                {/* <Input
                  value={editForm.address_country}
                  onChange={v => handleEditFormChange('address_country', v)}
                  placeholder={t('Country')}
                  size='large'
                  label={t('Country')}
                  className='mb-2'
                /> */}
                  <Select
                    value={editForm.country_code}
                    onChange={v => handleEditFormChange('country_code', v)}
                    placeholder={t('Country Code')}
                    size='large'
                    label={t('Country Code')}
                    className='mb-2'
                    optionList={countryOptions}
                    showClear
                    filter
                  />
                <Input
                  value={editForm.phone}
                  onChange={v => handleEditFormChange('phone', v)}
                  placeholder={t('Phone Number')}
                  size='large'
                  label={t('Phone Number')}
                  className='mb-2'
                />
              </Space>
              <Space className='mt-4 flex justify-end'>
                <Button onClick={handleEditCancel}>{t('Cancel')}</Button>
                <Button type='primary' onClick={handleEditSave}>{t('Save')}</Button>
              </Space>
            </Card>
          </div>
        )}
        {/* 账户绑定 Tab */}
        <TabPane
          tab={
            <div className='flex items-center'>
              <UserPlus size={16} className='mr-2' />
              {t('Account Binding')}
            </div>
          }
          itemKey='binding'
        >
          <div className='py-4'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              {/* Profile Info Card with single edit button */}
              <Card className='!rounded-xl col-span-2'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex flex-col flex-1 min-w-0 gap-2'>
                    <div className='flex items-center gap-2'>
                      <Avatar color='blue'>FN</Avatar>
                      <span className='font-medium text-gray-900'>Full Name:</span>
                      <span className='text-sm text-gray-500 truncate'>{userState.user?.full_name || '-'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Avatar color='orange'>Addr</Avatar>
                      <span className='font-medium text-gray-900'>Address:</span>
                      <span className='text-sm text-gray-500 truncate'>
                        {userState.user?.address_line1 || '-'}
                        {userState.user?.address_postal_code ? ', ' + userState.user?.address_postal_code : ''}
                        {userState.user?.address_city ? ', ' + userState.user?.address_city : ''}
                        {userState.user?.address_state ? ', ' + userState.user?.address_state : ''}
                        {userState.user?.address_country ? ', ' + userState.user?.address_country : ''}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Avatar color='green'>Country</Avatar>
                      <span className='font-medium text-gray-900'>Country Code:</span>
                      <span className='text-sm text-gray-500 truncate'>{userState.user?.country_code || '-'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Avatar color='purple'>Phone</Avatar>
                      <span className='font-medium text-gray-900'>Phone:</span>
                      <span className='text-sm text-gray-500 truncate'>{userState.user?.phone || '-'}</span>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button
                      type='primary'
                      theme='outline'
                      size='small'
                      onClick={handleEditClick}
                    >
                      {t('Edit')}
                    </Button>
                  </div>
                </div>
              </Card>
              {/* 邮箱绑定 */}
              <Card className='!rounded-xl'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center flex-1 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0'>
                      <IconMail
                        size='default'
                        className='text-slate-600 dark:text-slate-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900'>
                        {t('Email')}
                      </div>
                      <div className='text-sm text-gray-500 truncate'>
                        {renderAccountInfo(
                          userState.user?.email,
                          t('Email Address'),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button
                      type='primary'
                      theme='outline'
                      size='small'
                      onClick={() => setShowEmailBindModal(true)}
                    >
                      {userState.user && userState.user.email !== ''
                        ? t('修改绑定')
                        : t('绑定')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 微信绑定 */}
              <Card className='!rounded-xl'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center flex-1 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0'>
                      <SiWechat
                        size={20}
                        className='text-slate-600 dark:text-slate-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900'>
                        {t('WeChat')}
                      </div>
                      <div className='text-sm text-gray-500 truncate'>
                        {userState.user && userState.user.wechat_id !== ''
                          ? t('Bound')
                          : t('Not Bound')}
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button
                      type='primary'
                      theme='outline'
                      size='small'
                      disabled={!status.wechat_login}
                      onClick={() => setShowWeChatBindModal(true)}
                    >
                      {userState.user && userState.user.wechat_id !== ''
                        ? t('修改绑定')
                        : status.wechat_login
                          ? t('绑定')
                          : t('未启用')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* GitHub绑定 */}
              <Card className='!rounded-xl'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center flex-1 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0'>
                      <IconGithubLogo
                        size='default'
                        className='text-slate-600 dark:text-slate-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900'>
                        {t('GitHub')}
                      </div>
                      <div className='text-sm text-gray-500 truncate'>
                        {renderAccountInfo(
                          userState.user?.github_id,
                          t('GitHub ID'),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button
                      type='primary'
                      theme='outline'
                      size='small'
                      onClick={() =>
                        onGitHubOAuthClicked(status.github_client_id)
                      }
                      disabled={
                        (userState.user && userState.user.github_id !== '') ||
                        !status.github_oauth
                      }
                    >
                      {status.github_oauth ? t('绑定') : t('未启用')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* OIDC绑定 */}
              <Card className='!rounded-xl'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center flex-1 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0'>
                      <IconShield
                        size='default'
                        className='text-slate-600 dark:text-slate-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900'>
                        {t('OIDC')}
                      </div>
                      <div className='text-sm text-gray-500 truncate'>
                        {renderAccountInfo(
                          userState.user?.oidc_id,
                          t('OIDC ID'),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button
                      type='primary'
                      theme='outline'
                      size='small'
                      onClick={() =>
                        onOIDCClicked(
                          status.oidc_authorization_endpoint,
                          status.oidc_client_id,
                        )
                      }
                      disabled={
                        (userState.user && userState.user.oidc_id !== '') ||
                        !status.oidc_enabled
                      }
                    >
                      {status.oidc_enabled ? t('绑定') : t('未启用')}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Telegram绑定 */}
              <Card className='!rounded-xl'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center flex-1 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0'>
                      <SiTelegram
                        size={20}
                        className='text-slate-600 dark:text-slate-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900'>
                        {t('Telegram')}
                      </div>
                      <div className='text-sm text-gray-500 truncate'>
                        {renderAccountInfo(
                          userState.user?.telegram_id,
                          t('Telegram ID'),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    {status.telegram_oauth ? (
                      userState.user.telegram_id !== '' ? (
                        <Button disabled={true} size='small'>
                          {t('已绑定')}
                        </Button>
                      ) : (
                        <div className='scale-75'>
                          <TelegramLoginButton
                            dataAuthUrl='/api/oauth/telegram/bind'
                            botName={status.telegram_bot_name}
                          />
                        </div>
                      )
                    ) : (
                      <Button disabled={true} size='small'>
                        {t('未启用')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* LinuxDO绑定 */}
              <Card className='!rounded-xl'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='flex items-center flex-1 min-w-0'>
                    <div className='w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0'>
                      <SiLinux
                        size={20}
                        className='text-slate-600 dark:text-slate-300'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium text-gray-900'>
                        {t('LinuxDO')}
                      </div>
                      <div className='text-sm text-gray-500 truncate'>
                        {renderAccountInfo(
                          userState.user?.linux_do_id,
                          t('LinuxDO ID'),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <Button
                      type='primary'
                      theme='outline'
                      size='small'
                      onClick={() =>
                        onLinuxDOOAuthClicked(status.linuxdo_client_id)
                      }
                      disabled={
                        (userState.user && userState.user.linux_do_id !== '') ||
                        !status.linuxdo_oauth
                      }
                    >
                      {status.linuxdo_oauth ? t('绑定') : t('未启用')}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPane>

        {/* 安全设置 Tab */}
        <TabPane
          tab={
            <div className='flex items-center'>
              <ShieldCheck size={16} className='mr-2' />
              {t('Security Settings')}
            </div>
          }
          itemKey='security'
        >
          <div className='py-4'>
            <div className='space-y-6'>
              <Space vertical className='w-full'>
                {/* 系统访问令牌 */}
                <Card className='!rounded-xl w-full'>
                  <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                    <div className='flex items-start w-full sm:w-auto'>
                      <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                        <IconKey size='large' className='text-slate-600' />
                      </div>
                      <div className='flex-1'>
                        <Typography.Title heading={6} className='mb-1'>
                          {t('System Access Token')}
                        </Typography.Title>
                        <Typography.Text type='tertiary' className='text-sm'>
                          {t('Authentication token for API calls, please keep it safe')}
                        </Typography.Text>
                        {systemToken && (
                          <div className='mt-3'>
                            <Input
                              readonly
                              value={systemToken}
                              onClick={handleSystemTokenClick}
                              size='large'
                              prefix={<IconKey />}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type='primary'
                      theme='solid'
                      onClick={generateAccessToken}
                      className='!bg-slate-600 hover:!bg-slate-700 w-full sm:w-auto'
                      icon={<IconKey />}
                    >
                      {systemToken ? t('重新生成') : t('生成令牌')}
                    </Button>
                  </div>
                </Card>
                {/* Added space between cards */}
                

              


                {/* 密码管理 */}
                <Card className='!rounded-xl w-full'>
                  <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                    <div className='flex items-start w-full sm:w-auto'>
                      <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                        <IconLock size='large' className='text-slate-600' />
                      </div>
                      <div>
                        <Typography.Title heading={6} className='mb-1'>
                          {t('Password Management')}
                        </Typography.Title>
                        <Typography.Text type='tertiary' className='text-sm'>
                          {t('Regularly changing your password can improve account security')}
                        </Typography.Text>
                      </div>
                    </div>
                    <Button
                      type='primary'
                      theme='solid'
                      onClick={() => setShowChangePasswordModal(true)}
                      className='!bg-slate-600 hover:!bg-slate-700 w-full sm:w-auto'
                      icon={<IconLock />}
                    >
                      {t('修改密码')}
                    </Button>
                  </div>
                </Card>

                {/* 两步验证设置 */}
                <TwoFASetting t={t} />

                {/* 危险区域 */}
                <Card className='!rounded-xl w-full'>
                  <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
                    <div className='flex items-start w-full sm:w-auto'>
                      <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4 flex-shrink-0'>
                        <IconDelete size='large' className='text-slate-600' />
                      </div>
                      <div>
                        <Typography.Title
                          heading={6}
                          className='mb-1 text-slate-700'
                        >
                          {t('Delete Account')}
                        </Typography.Title>
                        <Typography.Text type='tertiary' className='text-sm'>
                          {t('This action is irreversible, all data will be permanently deleted')}
                        </Typography.Text>
                      </div>
                    </div>
                    <Button
                      type='danger'
                      theme='solid'
                      onClick={() => setShowAccountDeleteModal(true)}
                      className='w-full sm:w-auto !bg-slate-500 hover:!bg-slate-600'
                      icon={<IconDelete />}
                    >
                      {t('删除账户')}
                    </Button>
                  </div>
                </Card>
              </Space>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default AccountManagement;
