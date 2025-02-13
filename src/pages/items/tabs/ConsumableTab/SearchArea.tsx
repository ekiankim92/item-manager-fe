import { httpClient } from '@/apis'
import { consumableSearchState } from '@/store'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Checkbox, Form, FormProps, Input, Select } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import useModal from '@/hooks/useModal'
import CreateItemModal from './createItemModal'

const SearchArea = () => {
  const [form] = useForm<{
    labels: string[]
    name: string
    order: string
    checkThreshold: boolean
  }>()

  const [consumableSearch, setConsumableSearch] = useRecoilState(consumableSearchState)

  const { visible, showModal, hideModal } = useModal()

  useEffect(() => form.resetFields(), [form, consumableSearch])

  const getLabelsQuery = useQuery(['labels'], httpClient.labels.getLabels, {
    select({ data }) {
      return (
        data?.map((item) => ({
          value: item.labelNo?.toString(),
          label: item.name,
        })) || []
      )
    },
  })

  const handleValuesChange: FormProps['onValuesChange'] = (changedValues) => {
    if (!changedValues.name) {
      setSearchValue()
    }
  }

  const handleSubmit: FormProps['onFinish'] = () => {
    setSearchValue()
  }

  const setSearchValue = () => {
    const { order, ...rest } = form.getFieldsValue()
    // console.log(rest)

    const matchedValue = order?.match(/(.+)([+-])/) as [
      never,
      'priority' | 'quantity' | 'latest_purchase_date' | 'latest_consume_date',
      '+' | '-'
    ]

    let orderBy: 'priority' | 'quantity' | 'latest_purchase_date' | 'latest_consume_date',
      sort: '+' | '-'

    if (matchedValue) {
      orderBy = matchedValue[1]
      sort = matchedValue[2]
    }

    setConsumableSearch((data) => ({ ...data, ...rest, orderBy, sort, page: 1 }))
    console.log(consumableSearch)
  }

  return (
    <div className='flex flex-wrap justify-between mb-4'>
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        initialValues={{
          ...consumableSearch,
          order: consumableSearch.orderBy
            ? `${consumableSearch.orderBy}${consumableSearch.sort}`
            : undefined,
        }}
        onFinish={handleSubmit}
      >
        <div className='flex flex-wrap gap-x-3'>
          <Form.Item name='name'>
            <Input
              size='middle'
              placeholder='물품명으로 검색'
              prefix={<SearchOutlined />}
              className='w-48'
              allowClear
            />
          </Form.Item>
          <Form.Item name='labels'>
            <Select<string[]>
              className='min-w-[192px]'
              allowClear
              mode='multiple'
              placeholder='라벨 검색'
              options={getLabelsQuery.data}
              loading={getLabelsQuery.isLoading}
              optionFilterProp='label'
            />
          </Form.Item>
          <Form.Item name='order'>
            <Select placeholder='정렬' className='w-48' allowClear>
              <Select.Option value='priority+'>중요도 오름차순</Select.Option>
              <Select.Option value='priority-'>중요도 내림차순</Select.Option>
              <Select.Option value='quantity+'>남은 수량 오름차순</Select.Option>
              <Select.Option value='quantity-'>남은 수량 내림차순</Select.Option>
              <Select.Option value='latest_purchase_date+'>구매일 오름차순</Select.Option>
              <Select.Option value='latest_purchase_date-'>구매일 내림차순</Select.Option>
              <Select.Option value='latest_consume_date+'>사용일 오름차순</Select.Option>
              <Select.Option value='latest_consume_date-'>사용일 내림차순</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name='size'>
            <Select placeholder='20개씩 보기' className='w-28' allowClear>
              <Select.Option value={10}>10개씩 보기</Select.Option>
              <Select.Option value={20}>20개씩 보기</Select.Option>
              <Select.Option value={50}>50개씩 보기</Select.Option>
              <Select.Option value={100}>100개씩 보기</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name='checkThreshold' valuePropName='checked'>
            <Checkbox>구매 임박 상품만 보기</Checkbox>
          </Form.Item>
        </div>
        <button type='submit' className='hidden'></button>
      </Form>
      <Button type='primary' className='ml-auto' onClick={showModal}>
        물품 추가
      </Button>
      {visible && <CreateItemModal hideModal={hideModal} />}
    </div>
  )
}

export default SearchArea
