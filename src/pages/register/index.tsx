import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEyeSlash, faUser, faEye, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { ChangeEvent, useState } from 'react'
import { httpClient } from '@/apis'
import { schema, NavigationUtil } from '@/utils'
import { useNavigate } from 'react-router'

const Register = () => {
  const navigate = useNavigate()
  const [isShow, setIsShow] = useState<boolean>(false)
  const [isShowPass, setIsShowPass] = useState<boolean>(false)
  const [inputs, setInputs] = useState({
    id: '',
    username: '',
    password: '',
    passwordConfirm: '',
  })

  const onChangeInputs = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    })
  }

  const onClickShowPass = (): void => {
    setIsShow((prev) => !prev)
  }

  const onClickShowPassConfirm = (): void => {
    setIsShowPass((prev) => !prev)
  }

  const onClickRegister = async () => {
    schema({ ...inputs })

    try {
      await httpClient.users.createUser({ ...inputs })
    } catch (error) {
      if (error instanceof Error) console.log('register error:', error.message)
    }

    navigate(NavigationUtil.login)
  }

  return (
    <div className='w-screen h-screen flex items-center justify-center bg-bkg'>
      <div className='w-518 h-471 bg-white shadow-1 flex flex-col items-center justify-evenly rounded-lg'>
        <h1 className='w-80 h-10 font-bold text-3xl flex items-center justify-center'>
          물품관리서비스 <span className='text-main pl-2'>회원가입</span>
        </h1>
        <div>
          <input
            placeholder='Email'
            className='w-72 h-10 pl-3 outline-none border-b-2 bg-white'
            name='username'
            onChange={onChangeInputs}
          />
          <FontAwesomeIcon icon={faEnvelope} className='relative right-6' />
        </div>
        <div>
          <input
            placeholder='Username'
            className='w-72 h-10 pl-3 outline-none border-b-2 bg-white'
            name='id'
            onChange={onChangeInputs}
          />
          <FontAwesomeIcon icon={faUser} className='relative right-6' />
        </div>
        <div>
          <input
            placeholder='Password'
            type={isShow ? 'text' : 'password'}
            className='w-72 h-10 pl-3 outline-none border-b-2'
            name='password'
            onChange={onChangeInputs}
          />
          {isShow ? (
            <FontAwesomeIcon
              icon={faEye}
              className='relative right-6 cursor-pointer'
              onClick={onClickShowPass}
            />
          ) : (
            <FontAwesomeIcon
              icon={faEyeSlash}
              className='relative right-6 cursor-pointer'
              onClick={onClickShowPass}
            />
          )}
        </div>
        <div>
          <input
            placeholder='Password Confirm'
            type={isShowPass ? 'text' : 'password'}
            className='w-72 h-10 pl-3 outline-none border-b-2'
            name='passwordConfirm'
            onChange={onChangeInputs}
          />
          {isShowPass ? (
            <FontAwesomeIcon
              icon={faEye}
              className='relative right-6 cursor-pointer'
              onClick={onClickShowPassConfirm}
            />
          ) : (
            <FontAwesomeIcon
              icon={faEyeSlash}
              className='relative right-6 cursor-pointer'
              onClick={onClickShowPassConfirm}
            />
          )}
        </div>
        <button
          className='w-430 h-46 flex items-center justify-center bg-main rounded-md hover:opacity-95'
          onClick={onClickRegister}
        >
          REGISTER
        </button>
      </div>
    </div>
  )
}
export default Register
