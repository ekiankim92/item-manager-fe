import { httpClient, ItemRS, LabelRS, PlacesRS, RoomsRS, UpdateItemRQ } from '@/apis'
import { Label } from '@/components/label/Label'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Form,
  FormProps,
  Input,
  Modal,
  Select,
  Radio,
  Upload,
  UploadFile,
  UploadProps,
  InputNumber,
  Row,
  Col,
  Popover,
  message,
} from 'antd'
import { PictureOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PriorityProgressBar } from '@/components/progress'
import { RcFile, UploadListType } from 'antd/lib/upload/interface'
import ImgCrop from 'antd-img-crop'
import imageCompression from 'browser-image-compression'
import { AxiosError } from 'axios'

interface ItemEditProps {
  hideModal: () => void
  itemDetail?: ItemRS
}

const ItemEditModal = ({ hideModal, itemDetail }: ItemEditProps) => {
  const [form] = Form.useForm()
  const { TextArea } = Input
  const handleOk = () => {
    form.submit()
  }

  const { itemNo } = useParams()
  const [roomNo, setRoomNo] = useState<number | undefined>(itemDetail?.roomNo)
  const [priorityValue, setPriority] = useState(itemDetail?.priority)

  const { data: roomList } = useQuery({
    queryKey: ['roomList'],
    queryFn: async () => await httpClient.locations.allRooms(),
  })
  const getPlaces = useQuery({
    queryKey: ['rooms', roomNo],
    queryFn: () => httpClient.locations.getPlacesByRoomNo({ roomNo: roomNo }),
    enabled: roomNo !== undefined,
  })

  const onChangeRoomValue = async (value: number | undefined) => {
    if (value) {
      setRoomNo(value)
      form.setFieldValue('locationNo', null)
    }
  }
  const onChangePriority = (newValue: number | null): void => {
    setPriority(Number(newValue))
    form.setFieldValue('priority', Number(newValue))
  }

  // upload image
  const [fileList, setFileList] = useState<UploadFile[]>(() => {
    return [
      {
        uid: '-1',
        name: '',
        fileName: itemDetail?.photoUrl?.replace(/^\/images\//, ''),
        url: itemDetail?.photoUrl,
      },
    ]
  })
  const initFileList = (): void => {
    setFileList([{ uid: '-1', name: '' }])
  }
  const [loading, setLoading] = useState(false)
  const actionImgCompress = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }
    try {
      return await imageCompression(file, options)
    } catch (error) {
      console.log(error)
    }
  }
  const beforeImageUpload: UploadProps['beforeUpload'] = (file: RcFile, FileList: RcFile[]) => {
    setLoading(true)
    initFileList()
    new Promise((resolve) => {
      if (file) resolve(actionImgCompress(file))
    })
      .then((compressedFile) => {
        const blob = compressedFile as Blob
        setFileList([
          {
            uid: file.uid || '-1',
            name: '',
            fileName: file.name,
            originFileObj: new File([blob], file?.name || 'name', { type: blob.type }) as RcFile,
          },
        ])
      })
      .then(() => {
        setLoading(false)
      })

    return false
  }
  // upload image

  const onClickSave: FormProps['onFinish'] = async (values: UpdateItemRQ) => {
    const originPhotoName = itemDetail?.photoUrl?.replace(/^\/images\//, '')

    let photoName = originPhotoName
    if (fileList[0].fileName !== originPhotoName) {
      const file = fileList[0].originFileObj
      if (file) {
        const imageRS = await httpClient.images.saveImage({ file: file })
        photoName = imageRS.data?.filename
      } else {
        photoName = undefined
      }
    }

    const data = {
      name: values.name,
      type: values.type,
      locationNo: values.locationNo,
      memo: values.memo,
      photoName: photoName,
      priority: values.priority,
      threshold: values.threshold,
      labels: values.labels,
    }
    console.log(data)

    try {
      await httpClient.items.patchItem(Number(itemNo), data)

      message.success('물품 정보가 수정되었습니다')
      hideModal()

      if (originPhotoName !== data.photoName) {
        if (originPhotoName) {
          httpClient.images.deleteImage(originPhotoName)
        }
      }

      window.location.reload()
    } catch (error) {
      message.error('물품 정보 수정에 실패하였습니다')
      if (error instanceof AxiosError) console.log('error patchItem:', error.response?.data)
    }
  }
  const cancle = (): void => {
    initFileList()
    hideModal()
  }

  return (
    <>
      <Modal
        open={true}
        onOk={handleOk}
        onCancel={cancle}
        width={858}
        okText={'수정'}
        cancelText={'닫기'}
        closable={false}
        bodyStyle={{ height: 470, overflowY: 'auto' }}
        centered={true}
        wrapClassName='item-modal'
        okButtonProps={{ className: 'max-md:w-[48%] md:w-1/4 md:h-9' }}
        cancelButtonProps={{ className: 'max-md:w-[48%] md:w-1/4 md:h-9' }}
      >
        <Form
          id='item-form'
          form={form}
          name='basic'
          className='w-full mt-3 '
          autoComplete='off'
          wrapperCol={{ span: 18 }}
          onFinish={onClickSave}
          initialValues={{
            photoName: itemDetail?.photoUrl?.replace(/^\/images\//, ''),
            priority: itemDetail?.priority,
            name: itemDetail?.name,
            type: itemDetail?.type,
            threshold: itemDetail?.threshold,
            roomNo: itemDetail?.roomNo,
            locationNo: itemDetail?.placeNo,
            labels: itemDetail?.labels?.map((el: LabelRS) => el.labelNo.toString()),
            memo: itemDetail?.memo,
          }}
          validateMessages={{
            required: '입력이 필요합니다',
          }}
        >
          <div className='grid md:grid-cols-2'>
            <div className='flex flex-col justify-center w-full'>
              <div className='ml-auto mr-auto'>
                <ImgCrop rotationSlider>
                  <Upload
                    accept='image/*'
                    listType='picture-card'
                    fileList={fileList}
                    beforeUpload={beforeImageUpload}
                    multiple={false}
                    showUploadList={{
                      showPreviewIcon: false,
                      showRemoveIcon: false,
                    }}
                    iconRender={(file: UploadFile, listType?: UploadListType) => {
                      if (loading) {
                        return <LoadingOutlined />
                      } else {
                        return <PictureOutlined />
                      }
                    }}
                    maxCount={1}
                  >
                    {' '}
                  </Upload>
                </ImgCrop>
              </div>
              <div className='flex justify-center'>
                <Popover content='사진 제거' placement='bottom'>
                  <Button
                    type='text'
                    icon={<DeleteOutlined />}
                    size='middle'
                    className='flex justify-center items-center'
                    onClick={initFileList}
                  />
                </Popover>
              </div>
            </div>

            <div className='flex flex-col w-full items-center'>
              <Form.Item hidden name='priority'>
                <InputNumber />
              </Form.Item>
              <div className='flex justify-center w-full mt-8'>
                <Row className='flex items-center w-full'>
                  <Col className='w-1/6'>
                    <Form.Item>
                      <PriorityProgressBar
                        priority={priorityValue}
                        strokeWidth={4}
                        className='w-8 cursor-pointer select-none'
                        onChange={onChangePriority}
                      />
                    </Form.Item>
                  </Col>
                  <Col className='flex w-5/6'>
                    <Form.Item name='name' rules={[{ required: true }]} className='w-full'>
                      <Input
                        placeholder='물품명 입력'
                        className='w-full h-12 border-none'
                        allowClear
                        name='name'
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <div className='flex flex-row w-full'>
                <Form.Item
                  // label='분류ㅤㅤ'
                  label='분류'
                  name='type'
                  rules={[{ required: true }]}
                  colon={false}
                  className='w-full'
                  labelCol={{ span: 4 }}
                  labelAlign='left'
                >
                  <Radio.Group>
                    <Radio value={'CONSUMABLE'}>소모품</Radio>
                    <Radio value={'EQUIPMENT'}>비품</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>

              <div className='flex flex-row w-full'>
                <Form.Item
                  label='기준 수량'
                  name='threshold'
                  colon={false}
                  className='w-1/2'
                  labelCol={{ span: 8 }}
                  labelAlign='left'
                  rules={[
                    { required: true, message: '${label}을 입력해 주세요.' },
                    { type: 'number', min: 0, message: '0보다 큰 값을 입력해주세요' },
                  ]}
                  tooltip={{
                    title: '구매 임박 표시 기준이 되는 수량',
                    className: 'text-xs ml-px',
                  }}
                >
                  <InputNumber<number>
                    className='w-5/6'
                    formatter={(value) =>
                      value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''
                    }
                    parser={(value) => (value ? parseInt(value.replace(/\$\s?|(,*)/g, '')) : 0)}
                    max={999}
                    onClick={() => {
                      form.setFieldValue('threshold', null)
                    }}
                  />
                </Form.Item>
              </div>

              <div className='flex flex-row grid-cols-2 items-center w-full'>
                <Form.Item
                  label='장소'
                  name='roomNo'
                  className='w-1/2'
                  colon={false}
                  labelCol={{ span: 8 }}
                  labelAlign='left'
                  tooltip={{
                    title: '[보관장소 관리]의 장소(방)',
                    className: 'text-xs ml-px',
                  }}
                >
                  <Select
                    onChange={onChangeRoomValue}
                    className='w-5/6'
                    options={roomList?.data?.map((el: RoomsRS) => ({
                      value: el.roomNo,
                      label: el.name,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  label='위치'
                  name='locationNo'
                  rules={[{ required: true, message: '필수: 장소를 선택하면 목록이 생성됩니다' }]}
                  className='w-1/2'
                  colon={false}
                  labelCol={{ span: 5 }}
                  labelAlign='left'
                  tooltip={{
                    title:
                      '[보관장소 관리]의 위치(가구)이다. [장소]를 선택하면 해당 장소에 속하는 위치 목록이 생성된다',
                    className: 'text-xs ml-px',
                  }}
                >
                  <Select
                    className='w-5/6'
                    options={getPlaces?.data?.data?.map((el: PlacesRS) => ({
                      value: el.placeNo,
                      label: el.name,
                    }))}
                  />
                </Form.Item>
              </div>

              <div className='flex justify-center w-full'>
                <Form.Item
                  // label='라벨ㅤㅤ'
                  label='라벨'
                  name='labels'
                  colon={false}
                  className='w-full'
                  labelCol={{ span: 4 }}
                  labelAlign='left'
                >
                  <Label />
                </Form.Item>
              </div>

              <div className='w-full'>
                <Form.Item
                  label='메모'
                  name='memo'
                  colon={false}
                  className='w-full'
                  labelCol={{ span: 4 }}
                  labelAlign='left'
                >
                  <TextArea placeholder='메모' rows={4} className='w-full' allowClear />
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>
      </Modal>
    </>
  )
}
export default ItemEditModal
