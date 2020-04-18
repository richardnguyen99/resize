import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useReducer,
} from 'react'
import styled from 'styled-components'

const StyledTitle = styled.div`
  position: absolute;
  display: flex;

  width: 100%;

  background: #f0f0f0;
  color: #0f0f0f;

  font-size: 16px;

  align-items: center;
`

interface StyledProps {
  width: number
  height: number
  top: number
  left: number
  cursor: string
}

const StyledContainer = styled.div`
  position: absolute;

  background: black;
  color: white;
`

interface ResizeProps {
  initial?: Partial<Omit<StyledProps, 'cursor'>>
}

const Resize: React.FC<ResizeProps> = ({ children, initial }) => {
  const [state, setState] = useState({
    width: initial && initial.width ? initial.width : 860,
    height: initial && initial.height ? initial.height : 480,
    top: initial && initial.top ? initial.top : 20,
    left: initial && initial.left ? initial.left : 20,
  })
  const [hit, setHit] = useState({
    top: false,
    right: false,
    bottom: false,
    left: false,
  })
  const [cursor, setCursor] = useState({
    posX: 0,
    posY: 0,
    style: 'auto',
  })
  const [clicked, setClicked] = useState<{
    x: number
    y: number
    top: number
    left: number
    boundingBox: DOMRect
  } | null>(null)

  const forceUpdate = useReducer(() => ({}), {})[1] as () => void

  const ref = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  const updateCursor = useCallback(
    (e: MouseEvent): void => {
      const boundingBox = ref.current?.getBoundingClientRect()

      setCursor((prevState) => ({
        ...prevState,
        posX: e.clientX,
        posY: e.clientY,
      }))

      if (boundingBox) {
        const hitTop = cursor.posY <= boundingBox.top + 10
        const hitBottom = cursor.posY >= boundingBox.bottom - 10
        const hitLeft = cursor.posX <= boundingBox.left + 10
        const hitRight = cursor.posX >= boundingBox.right - 10

        setCursor((prevState) => ({
          ...prevState,
          style: 'auto',
        }))

        if (hitTop || hitBottom || hitLeft || hitRight) {
          if (hitRight && hitTop) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'ne-resize',
            }))
          } else if (hitRight && hitBottom) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'se-resize',
            }))
          } else if (hitLeft && hitTop) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'nw-resize',
            }))
          } else if (hitLeft && hitBottom) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'sw-resize',
            }))
          } else if (hitTop || hitBottom) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'ns-resize',
            }))
          } else if (hitLeft || hitRight) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'ew-resize',
            }))
          }
          e.stopPropagation()
        } else {
          const titleBoundingRect = titleRef.current?.getBoundingClientRect()

          if (
            titleBoundingRect &&
            cursor.posX > titleBoundingRect.left &&
            cursor.posY < titleBoundingRect.right &&
            cursor.posY > titleBoundingRect.top &&
            cursor.posY < titleBoundingRect.bottom
          ) {
            setCursor((prevState) => ({
              ...prevState,
              style: 'move',
            }))
          }
        }

        setHit({
          top: hitTop,
          right: hitRight,
          bottom: hitBottom,
          left: hitLeft,
        })
      }
    },
    [cursor.posX, cursor.posY]
  )

  const onMouseMove = useCallback(
    (e: MouseEvent): void => {
      updateCursor(e)

      if (clicked !== null) {
        forceUpdate()
      }
    },
    [clicked, updateCursor, forceUpdate]
  )

  const onMouseUp = useCallback(
    (e: MouseEvent): void => {
      setClicked(null)
      updateCursor(e)
    },
    [updateCursor]
  )

  const onMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    const boundingBox = ref.current?.getBoundingClientRect()

    if (boundingBox && ref.current) {
      setClicked({
        x: e.clientX,
        y: e.clientY,
        boundingBox,
        top: ref.current.offsetTop,
        left: ref.current.offsetLeft,
      })
    }
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return (): void => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  useEffect(() => {
    if (clicked) {
      const { top, right, bottom, left } = hit
      const { boundingBox } = clicked

      if (top || left || right || bottom) {
        if (right)
          setState((prevState) => ({
            ...prevState,
            width: Math.max(cursor.posX - boundingBox.left, 280),
          }))
        if (bottom)
          setState((prevState) => ({
            ...prevState,
            height: Math.max(cursor.posY - boundingBox.top, 280),
          }))
        if (top) {
          const currentHeight = boundingBox.bottom - cursor.posY
          if (currentHeight > 280) {
            setState((prevState) => ({
              ...prevState,
              height: currentHeight,
              top: clicked.top + cursor.posY - clicked.y,
            }))
          }
        }
        if (left) {
          const currentWidth = boundingBox.right - cursor.posX
          if (currentWidth > 280) {
            setState((prevState) => ({
              ...prevState,
              width: currentWidth,
              left: clicked.left + cursor.posX - clicked.x,
            }))
          }
        }
      } else if (cursor.style === 'move') {
        setState((prevState) => ({
          ...prevState,
          top: clicked.top + cursor.posY - clicked.y,
          left: clicked.left + cursor.posX - clicked.x,
        }))
      }
    }
  }, [clicked, cursor.posX, cursor.posY, cursor.style, hit])

  return (
    <StyledContainer
      ref={ref}
      style={{
        width: `${state.width}px`,
        height: `${state.height}px`,
        top: `${state.top}px`,
        left: `${state.left}px`,
        cursor: cursor.style,
      }}
      onMouseDownCapture={onMouseDown}
    >
      <StyledTitle ref={titleRef}>Hello</StyledTitle>
      {children}
    </StyledContainer>
  )
}

export default Resize
