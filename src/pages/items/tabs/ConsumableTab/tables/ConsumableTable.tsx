import { ConsumableItemRS, ConsumableItemsRQ, httpClient } from '@/apis'
import { PriorityProgressBar } from '@/components/progress'
import BasicTable from '@/components/tables/BasicTable'
import { DeleteFilled, EllipsisOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, PaginationProps, Tag, Tooltip } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { useRecoilState } from 'recoil'
import { consumableSearchState } from '../store'

const ConsumableTable = () => {
  const [consumableSearch, setConsumableSearch] = useRecoilState(consumableSearchState)
  const navigate = useNavigate()

  const criteria: ConsumableItemsRQ = {
    name: consumableSearch.name,
    labelNos: consumableSearch.labels?.map((item) => +item) || [],
    orderBy: consumableSearch.orderBy,
    sort: consumableSearch.sort,
    page: consumableSearch.page,
    size: consumableSearch.size,
  }

  const query = useQuery({
    queryKey: ['items', criteria],
    queryFn: () => httpClient.items.getConsumableItems(criteria),
  })

  const columns: ColumnsType<ConsumableItemRS> = [
    {
      title: '중요도',
      dataIndex: 'priority',
      key: 'priority',
      align: 'center',
      render: (priority) => {
        return (
          <div className='w-5 mx-auto'>
            <PriorityProgressBar priority={priority} />
          </div>
        )
      },
      width: 80,
    },
    {
      title: '물품명',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      width: 200,
    },
    {
      title: '라벨',
      dataIndex: 'labels',
      key: 'labels',
      align: 'center',
      render(_value, record, _index) {
        return (
          <div className='inline-flex flex-wrap gap-y-2'>
            {record.labels?.map((item) => (
              <Tag key={item.labelNo} color='default'>
                {item.name}
              </Tag>
            ))}
          </div>
        )
      },
      width: 200,
    },
    {
      title: '최근 구매일',
      dataIndex: 'latestPurchaseDate',
      key: 'latestPurchaseDate',
      align: 'center',
      width: 120,
      render: (value) => value && dayjs(value).format('YYYY.MM.DD'),
    },
    {
      title: '최근 사용일',
      dataIndex: 'latestConsumeDate',
      key: 'latestConsumeDate',
      align: 'center',
      width: 120,
      render: (value) => value && dayjs(value).format('YYYY.MM.DD'),
    },
    {
      title: '남은 수량',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 100,
      render(_value, record) {
        return `${record.quantity?.toLocaleString() || 0}개`
      },
    },

    {
      title: '사용하기',
      key: '사용하기',
      align: 'center',
      render(_value, _record, _index) {
        return <Button type='primary'>1개 사용</Button>
      },
      width: 100,
    },
    {
      title: '구매',
      key: '구매',
      align: 'center',
      render(_value, _record, _index) {
        return <Button type='primary'>구매</Button>
      },
      width: 100,
    },
    {
      title: <EllipsisOutlined />,
      key: '구매',
      align: 'center',
      render(_value, _record, _index) {
        return (
          <Tooltip title='삭제'>
            <Button
              type='text'
              shape='circle'
              icon={<DeleteFilled className='text-stone-500' />}
              className='flex items-center justify-center py-0 mx-auto'
            />
          </Tooltip>
        )
      },
      width: 70,
    },
  ]

  const handlePageChange: PaginationProps['onChange'] = (page, _pageSize) => {
    setConsumableSearch((value) => ({ ...value, page }))
  }

  return (
    <BasicTable<ConsumableItemRS>
      columns={columns}
      rowKey='itemNo'
      // @ts-ignore
      dataSource={query.data?.data}
      loading={query.isLoading}
      tableLayout='fixed'
      scroll={{ x: 250 }}
      size='large'
      pagination={{
        current: consumableSearch.page,
        pageSize: consumableSearch.size,
        total: query.data?.page?.totalDataCnt,
        onChange: handlePageChange,
        // showSizeChanger: true,
      }}
      onRow={(data) => {
        return {
          onClick: () => navigate(`/items/${data?.itemNo}`),
        }
      }}
    />
  )
}

export default ConsumableTable
