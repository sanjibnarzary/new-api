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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Table,
  Tag,
  Typography,
  Space,
  Tooltip,
  Popconfirm,
  Empty,
  Spin,
  Select,
  Row,
  Col,
  Badge,
  Progress,
  Card,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import {
  API,
  showError,
  showSuccess,
  timestamp2string,
} from '../../../../helpers';

const { Text } = Typography;

const MultiKeyManageModal = ({ visible, onCancel, channel, onRefresh }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [keyStatusList, setKeyStatusList] = useState([]);
  const [operationLoading, setOperationLoading] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Statistics states
  const [enabledCount, setEnabledCount] = useState(0);
  const [manualDisabledCount, setManualDisabledCount] = useState(0);
  const [autoDisabledCount, setAutoDisabledCount] = useState(0);

  // Filter states
  const [statusFilter, setStatusFilter] = useState(null); // null=all, 1=enabled, 2=manual_disabled, 3=auto_disabled

  // Load key status data
  const loadKeyStatus = async (
    page = currentPage,
    size = pageSize,
    status = statusFilter,
  ) => {
    if (!channel?.id) return;

    setLoading(true);
    try {
      const requestData = {
        channel_id: channel.id,
        action: 'get_key_status',
        page: page,
        page_size: size,
      };

      // Add status filter if specified
      if (status !== null) {
        requestData.status = status;
      }

      const res = await API.post('/api/channel/multi_key/manage', requestData);

      if (res.data.success) {
        const data = res.data.data;
        setKeyStatusList(data.keys || []);
        setTotal(data.total || 0);
        setCurrentPage(data.page || 1);
        setPageSize(data.page_size || 10);
        setTotalPages(data.total_pages || 0);

        // Update statistics (these are always the overall statistics)
        setEnabledCount(data.enabled_count || 0);
        setManualDisabledCount(data.manual_disabled_count || 0);
        setAutoDisabledCount(data.auto_disabled_count || 0);
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      console.error(error);
      showError('Failed to fetch key status');
    } finally {
      setLoading(false);
    }
  };

  // Disable a specific key
  const handleDisableKey = async (keyIndex) => {
    const operationId = `disable_${keyIndex}`;
    setOperationLoading((prev) => ({ ...prev, [operationId]: true }));

    try {
      const res = await API.post('/api/channel/multi_key/manage', {
        channel_id: channel.id,
        action: 'disable_key',
        key_index: keyIndex,
      });

      if (res.data.success) {
        showSuccess(t('Key has been disabled'));
        await loadKeyStatus(currentPage, pageSize); // Reload current page
        onRefresh && onRefresh(); // Refresh parent component
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to disable key'));
    } finally {
      setOperationLoading((prev) => ({ ...prev, [operationId]: false }));
    }
  };

  // Enable a specific key
  const handleEnableKey = async (keyIndex) => {
    const operationId = `enable_${keyIndex}`;
    setOperationLoading((prev) => ({ ...prev, [operationId]: true }));

    try {
      const res = await API.post('/api/channel/multi_key/manage', {
        channel_id: channel.id,
        action: 'enable_key',
        key_index: keyIndex,
      });

      if (res.data.success) {
        showSuccess(t('Key has been enabled'));
        await loadKeyStatus(currentPage, pageSize); // Reload current page
        onRefresh && onRefresh(); // Refresh parent component
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to enable key'));
    } finally {
      setOperationLoading((prev) => ({ ...prev, [operationId]: false }));
    }
  };

  // Enable all disabled keys
  const handleEnableAll = async () => {
    setOperationLoading((prev) => ({ ...prev, enable_all: true }));

    try {
      const res = await API.post('/api/channel/multi_key/manage', {
        channel_id: channel.id,
        action: 'enable_all_keys',
      });

      if (res.data.success) {
        showSuccess(res.data.message || t('All keys have been enabled'));
        // Reset to first page after bulk operation
        setCurrentPage(1);
        await loadKeyStatus(1, pageSize);
        onRefresh && onRefresh(); // Refresh parent component
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to enable all keys'));
    } finally {
      setOperationLoading((prev) => ({ ...prev, enable_all: false }));
    }
  };

  // Disable all enabled keys
  const handleDisableAll = async () => {
    setOperationLoading((prev) => ({ ...prev, disable_all: true }));

    try {
      const res = await API.post('/api/channel/multi_key/manage', {
        channel_id: channel.id,
        action: 'disable_all_keys',
      });

      if (res.data.success) {
        showSuccess(res.data.message || t('All keys have been disabled'));
        // Reset to first page after bulk operation
        setCurrentPage(1);
        await loadKeyStatus(1, pageSize);
        onRefresh && onRefresh(); // Refresh parent component
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to disable all keys'));
    } finally {
      setOperationLoading((prev) => ({ ...prev, disable_all: false }));
    }
  };

  // Delete all disabled keys
  const handleDeleteDisabledKeys = async () => {
    setOperationLoading((prev) => ({ ...prev, delete_disabled: true }));

    try {
      const res = await API.post('/api/channel/multi_key/manage', {
        channel_id: channel.id,
        action: 'delete_disabled_keys',
      });

      if (res.data.success) {
        showSuccess(res.data.message);
        // Reset to first page after deletion as data structure might change
        setCurrentPage(1);
        await loadKeyStatus(1, pageSize);
        onRefresh && onRefresh(); // Refresh parent component
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to delete disabled keys'));
    } finally {
      setOperationLoading((prev) => ({ ...prev, delete_disabled: false }));
    }
  };

  // Delete a specific key
  const handleDeleteKey = async (keyIndex) => {
    const operationId = `delete_${keyIndex}`;
    setOperationLoading((prev) => ({ ...prev, [operationId]: true }));

    try {
      const res = await API.post('/api/channel/multi_key/manage', {
        channel_id: channel.id,
        action: 'delete_key',
        key_index: keyIndex,
      });

      if (res.data.success) {
        showSuccess(t('Key has been deleted'));
        await loadKeyStatus(currentPage, pageSize); // Reload current page
        onRefresh && onRefresh(); // Refresh parent component
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('Failed to delete key'));
    } finally {
      setOperationLoading((prev) => ({ ...prev, [operationId]: false }));
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadKeyStatus(page, pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
    loadKeyStatus(1, size);
  };

  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
    loadKeyStatus(1, pageSize, status);
  };

  // Effect to load data when modal opens
  useEffect(() => {
    if (visible && channel?.id) {
      setCurrentPage(1); // Reset to first page when opening
      loadKeyStatus(1, pageSize);
    }
  }, [visible, channel?.id]);

  // Reset pagination when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentPage(1);
      setKeyStatusList([]);
      setTotal(0);
      setTotalPages(0);
      setEnabledCount(0);
      setManualDisabledCount(0);
      setAutoDisabledCount(0);
      setStatusFilter(null); // Reset filter
    }
  }, [visible]);

  // Percentages for progress display
  const enabledPercent =
    total > 0 ? Math.round((enabledCount / total) * 100) : 0;
  const manualDisabledPercent =
    total > 0 ? Math.round((manualDisabledCount / total) * 100) : 0;
  const autoDisabledPercent =
    total > 0 ? Math.round((autoDisabledCount / total) * 100) : 0;

  // 取消饼图：不再需要图表数据与配置

  // Get status tag component
  const renderStatusTag = (status) => {
    switch (status) {
      case 1:
        return (
          <Tag color='green' shape='circle' size='small'>
            {t('Enabled')}
          </Tag>
        );
      case 2:
        return (
          <Tag color='red' shape='circle' size='small'>
            {t('Disabled')}
          </Tag>
        );
      case 3:
        return (
          <Tag color='orange' shape='circle' size='small'>
            {t('Auto Disabled')}
          </Tag>
        );
      default:
        return (
          <Tag color='grey' shape='circle' size='small'>
            {t('Unknown Status')}
          </Tag>
        );
    }
  };

  // Table columns definition
  const columns = [
    {
      title: t('Index'),
      dataIndex: 'index',
      render: (text) => `#${text}`,
    },
    // {
    //   title: t('Key Preview'),
    //   dataIndex: 'key_preview',
    //   render: (text) => (
    //     <Text code style={{ fontSize: '12px' }}>
    //       {text}
    //     </Text>
    //   ),
    // },
    {
      title: t('Status'),
      dataIndex: 'status',
      render: (status) => renderStatusTag(status),
    },
    {
      title: t('Disable Reason'),
      dataIndex: 'reason',
      render: (reason, record) => {
        if (record.status === 1 || !reason) {
          return <Text type='quaternary'>-</Text>;
        }
        return (
          <Tooltip content={reason}>
            <Text style={{ maxWidth: '200px', display: 'block' }} ellipsis>
              {reason}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: t('Disabled Time'),
      dataIndex: 'disabled_time',
      render: (time, record) => {
        if (record.status === 1 || !time) {
          return <Text type='quaternary'>-</Text>;
        }
        return (
          <Tooltip content={timestamp2string(time)}>
            <Text style={{ fontSize: '12px' }}>{timestamp2string(time)}</Text>
          </Tooltip>
        );
      },
    },
    {
      title: t('Actions'),
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          {record.status === 1 ? (
            <Button
              type='danger'
              size='small'
              loading={operationLoading[`disable_${record.index}`]}
              onClick={() => handleDisableKey(record.index)}
            >
              {t('Disable')}
            </Button>
          ) : (
            <Button
              type='primary'
              size='small'
              loading={operationLoading[`enable_${record.index}`]}
              onClick={() => handleEnableKey(record.index)}
            >
              {t('Enable')}
            </Button>
          )}
          <Popconfirm
            title={t('Are you sure you want to delete this key?')}
            content={t('This action is irreversible and will permanently delete the key')}
            onConfirm={() => handleDeleteKey(record.index)}
            okType={'danger'}
            position={'topRight'}
          >
            <Button
              type='danger'
              size='small'
              loading={operationLoading[`delete_${record.index}`]}
            >
              {t('Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <Text>{t('Multi-Key Management')}</Text>
          {channel?.name && (
            <Tag size='small' shape='circle' color='white'>
              {channel.name}
            </Tag>
          )}
          <Tag size='small' shape='circle' color='white'>
            {t('Total Keys')}: {total}
          </Tag>
          {channel?.channel_info?.multi_key_mode && (
            <Tag size='small' shape='circle' color='white'>
              {channel.channel_info.multi_key_mode === 'random'
                ? t('Random Mode')
                : t('Polling Mode')}
            </Tag>
          )}
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      width={900}
      footer={null}
    >
      <div className='flex flex-col mb-5'>
        {/* Stats & Mode */}
        <div
          className='rounded-xl p-4 mb-3'
          style={{
            background: 'var(--semi-color-bg-1)',
            border: '1px solid var(--semi-color-border)',
          }}
        >
          <Row gutter={16} align='middle'>
            <Col span={8}>
              <div
                style={{
                  background: 'var(--semi-color-bg-0)',
                  border: '1px solid var(--semi-color-border)',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <Badge dot type='success' />
                  <Text type='tertiary'>{t('Enabled')}</Text>
                </div>
                <div className='flex items-end gap-2 mb-2'>
                  <Text
                    style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}
                  >
                    {enabledCount}
                  </Text>
                  <Text
                    style={{ fontSize: 18, color: 'var(--semi-color-text-2)' }}
                  >
                    / {total}
                  </Text>
                </div>
                <Progress
                  percent={enabledPercent}
                  showInfo={false}
                  size='small'
                  stroke='#22c55e'
                  style={{ height: 6, borderRadius: 999 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div
                style={{
                  background: 'var(--semi-color-bg-0)',
                  border: '1px solid var(--semi-color-border)',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <Badge dot type='danger' />
                  <Text type='tertiary'>{t('Manually Disabled')}</Text>
                </div>
                <div className='flex items-end gap-2 mb-2'>
                  <Text
                    style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}
                  >
                    {manualDisabledCount}
                  </Text>
                  <Text
                    style={{ fontSize: 18, color: 'var(--semi-color-text-2)' }}
                  >
                    / {total}
                  </Text>
                </div>
                <Progress
                  percent={manualDisabledPercent}
                  showInfo={false}
                  size='small'
                  stroke='#ef4444'
                  style={{ height: 6, borderRadius: 999 }}
                />
              </div>
            </Col>
            <Col span={8}>
              <div
                style={{
                  background: 'var(--semi-color-bg-0)',
                  border: '1px solid var(--semi-color-border)',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <Badge dot type='warning' />
                  <Text type='tertiary'>{t('Automatically Disabled')}</Text>
                </div>
                <div className='flex items-end gap-2 mb-2'>
                  <Text
                    style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}
                  >
                    {autoDisabledCount}
                  </Text>
                  <Text
                    style={{ fontSize: 18, color: 'var(--semi-color-text-2)' }}
                  >
                    / {total}
                  </Text>
                </div>
                <Progress
                  percent={autoDisabledPercent}
                  showInfo={false}
                  size='small'
                  stroke='#f59e0b'
                  style={{ height: 6, borderRadius: 999 }}
                />
              </div>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className='flex-1 flex flex-col min-h-0'>
          <Spin spinning={loading}>
            <Card className='!rounded-xl'>
              <Table
                title={() => (
                  <Row gutter={12} style={{ width: '100%' }}>
                    <Col span={14}>
                      <Row gutter={12} style={{ alignItems: 'center' }}>
                        <Col>
                          <Select
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            size='small'
                            placeholder={t('All Statuses')}
                          >
                            <Select.Option value={null}>
                              {t('All Statuses')}
                            </Select.Option>
                            <Select.Option value={1}>
                              {t('Enabled')}
                            </Select.Option>
                            <Select.Option value={2}>
                              {t('Manually Disabled')}
                            </Select.Option>
                            <Select.Option value={3}>
                              {t('Automatically Disabled')}
                            </Select.Option>
                          </Select>
                        </Col>
                      </Row>
                    </Col>
                    <Col
                      span={10}
                      style={{ display: 'flex', justifyContent: 'flex-end' }}
                    >
                      <Space>
                        <Button
                          size='small'
                          type='tertiary'
                          onClick={() => loadKeyStatus(currentPage, pageSize)}
                          loading={loading}
                        >
                          {t('Refresh')}
                        </Button>
                        {manualDisabledCount + autoDisabledCount > 0 && (
                          <Popconfirm
                            title={t('Are you sure you want to enable all keys?')}
                            onConfirm={handleEnableAll}
                            position={'topRight'}
                          >
                            <Button
                              size='small'
                              type='primary'
                              loading={operationLoading.enable_all}
                            >
                              {t('Enable All')}
                            </Button>
                          </Popconfirm>
                        )}
                        {enabledCount > 0 && (
                          <Popconfirm
                            title={t('Are you sure you want to disable all keys?')}
                            onConfirm={handleDisableAll}
                            okType={'danger'}
                            position={'topRight'}
                          >
                            <Button
                              size='small'
                              type='danger'
                              loading={operationLoading.disable_all}
                            >
                              {t('Disable All')}
                            </Button>
                          </Popconfirm>
                        )}
                        <Popconfirm
                          title={t('Are you sure you want to delete all automatically disabled keys?')}
                          content={t(
                            'This action is irreversible and will permanently delete all automatically disabled keys',
                          )}
                          onConfirm={handleDeleteDisabledKeys}
                          okType={'danger'}
                          position={'topRight'}
                        >
                          <Button
                            size='small'
                            type='warning'
                            loading={operationLoading.delete_disabled}
                          >
                            {t('Delete Auto Disabled Keys')}
                          </Button>
                        </Popconfirm>
                      </Space>
                    </Col>
                  </Row>
                )}
                columns={columns}
                dataSource={keyStatusList}
                pagination={{
                  currentPage: currentPage,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOpts: [10, 20, 50, 100],
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    loadKeyStatus(page, size);
                  },
                  onShowSizeChange: (current, size) => {
                    setCurrentPage(1);
                    handlePageSizeChange(size);
                  },
                }}
                size='small'
                bordered={false}
                rowKey='index'
                scroll={{ x: 'max-content' }}
                empty={
                  <Empty
                    image={
                      <IllustrationNoResult
                        style={{ width: 140, height: 140 }}
                      />
                    }
                    darkModeImage={
                      <IllustrationNoResultDark
                        style={{ width: 140, height: 140 }}
                      />
                    }
                    title={t('No Key Data')}
                    description={t('Please check channel configuration or try refreshing')}
                    style={{ padding: 30 }}
                  />
                }
              />
            </Card>
          </Spin>
        </div>
      </div>
    </Modal>
  );
};

export default MultiKeyManageModal;