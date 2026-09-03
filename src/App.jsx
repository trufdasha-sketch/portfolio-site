import { useEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const A = `${import.meta.env.BASE_URL}assets`

const defaultPositions = {
  folder: {
    x: 26.967592592592588,
    y: 0.8670520231213872,
    width: 30.90277777777778,
    rotation: 90,
    perspectiveX: 2,
    perspectiveY: -12,
  },

  calculator: {
    x: 59.25924866287796,
    y: 8.91040432659877,
    width: 18.98148148148148,
    rotation: -4,
    perspectiveX: 1,
    perspectiveY: -15,
  },

  samokat: {
    x: 19.21296296296296,
    y: 50.2774621709923,
    width: 20.949074074074073,
    rotation: 5,
    perspectiveX: -14,
    perspectiveY: 18,
  },

  binoculars: {
    x: 36.22685538397895,
    y: 52.023120560398,
    width: 36.80555555555556,
    rotation: 0,
    perspectiveX: 0,
    perspectiveY: 0,
  },

  phone: {
    x: 64.81481834694192,
    y: 52.60115524247892,
    width: 19.444444444444446,
    rotation: -7,
    perspectiveX: 12,
    perspectiveY: 16,
  },

  award: {
    x: 19.9074074074074,
    y: 71.89018299124832,
    width: 14.930555555555555,
    rotation: 4,
    perspectiveX: -7,
    perspectiveY: 30,
  },

  pass: {
    x: 37.15278130990488,
    y: 29.144508990249197,
    width: 6.712962962962964,
    rotation: -16,
    perspectiveX: 0,
    perspectiveY: 0,
  },
}

const items = [
  {
    id: 'binoculars',
    image: `${A}/binoculars/binoculars.png`,
    title: 'Яндекс Маркет',
    description:
      'Интерактивный кейс с брифами «Дача» и «Хайкинг».',
  },

  {
    id: 'calculator',
    image: `${A}/calculator/calculator.png`,
    title: 'VK Analytics',
    description: 'Кейс с аналитикой VK Video.',
    presentation: `${A}/presentations/vk.pdf`,
  },

  {
    id: 'samokat',
    image: `${A}/samokat/samokat-bag.png`,
    title: 'Самокат',
    description:
      'Креативная концепция и рекламная кампания.',
    presentation: `${A}/presentations/samokat.pdf`,
  },

  {
    id: 'folder',
    image: `${A}/folder/folder-closed.png`,
    title: 'Документы',
    description:
      'Дипломы, сертификаты и профессиональные материалы.',
  },

  {
    id: 'award',
    image: `${A}/award/award-front.png`,
    title: 'Silver Mercury',
    description: 'Награда и презентация кейса.',
    presentation: `${A}/presentations/silver-mercury.pdf`,
  },

  {
    id: 'phone',
    image: `${A}/phone/phone.png`,
    title: 'МТС',
    description: 'Креативный кейс для МТС.',
    presentation: `${A}/presentations/mts.pdf`,
  },

  {
    id: 'pass',
    image: `${A}/pass/pass-front.png`,
    title: 'Контакты',
    description: 'Контактная информация.',
  },
]


/* =========================================================
   PDF VIEWER
========================================================= */

function PDFViewer({ src, onClose }) {
  const canvasRef = useRef(null)
  const viewerRef = useRef(null)

  const [pdf, setPdf] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(true)

  /* Загрузка PDF */

  useEffect(() => {
    let cancelled = false

    const loadPDF = async () => {
      try {
        setLoading(true)
        setPdf(null)
        setPageCount(0)
        setPageNumber(1)

        const loadedPdf = await pdfjsLib
          .getDocument({
            url: src,
          })
          .promise

        if (cancelled) return

        setPdf(loadedPdf)
        setPageCount(loadedPdf.numPages)
        setPageNumber(1)
      } catch (error) {
        if (!cancelled) {
          console.error('Ошибка загрузки PDF:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPDF()

    return () => {
      cancelled = true
    }
  }, [src])


  /* Отрисовка страницы */

  useEffect(() => {
    if (
      !pdf ||
      !canvasRef.current ||
      !viewerRef.current
    ) {
      return
    }

    let cancelled = false
    let renderTask = null

    const renderPage = async () => {
      try {
        const page = await pdf.getPage(pageNumber)

        if (cancelled) return

        const viewer = viewerRef.current
        const canvas = canvasRef.current

        if (!viewer || !canvas) return

        /*
          Safari иногда определяет размеры модального окна
          не сразу после его открытия.
        */

        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve)
          })
        })

        if (cancelled) return

        const baseViewport = page.getViewport({
          scale: 1,
        })

        const availableWidth = Math.max(
          viewer.clientWidth - 40,
          100
        )

        const availableHeight = Math.max(
          viewer.clientHeight - 40,
          100
        )

        const widthScale =
          availableWidth / baseViewport.width

        const heightScale =
          availableHeight / baseViewport.height

        let scale = Math.min(
          widthScale,
          heightScale
        )

        /*
          Защита от слишком большого canvas
          на iPhone/iPad.
        */

        if (!Number.isFinite(scale) || scale <= 0) {
          scale = 1
        }

        const viewport = page.getViewport({
          scale,
        })

        /*
          Ограничиваем pixel ratio.
          Это значительно снижает вероятность
          проблем с canvas на Safari.
        */

        const pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          2
        )

        canvas.width = Math.max(
          1,
          Math.floor(
            viewport.width * pixelRatio
          )
        )

        canvas.height = Math.max(
          1,
          Math.floor(
            viewport.height * pixelRatio
          )
        )

        canvas.style.width =
          `${viewport.width}px`

        canvas.style.height =
          `${viewport.height}px`

        const context =
          canvas.getContext('2d', {
            alpha: false,
          })

        if (!context) return

        context.setTransform(
          pixelRatio,
          0,
          0,
          pixelRatio,
          0,
          0
        )

        renderTask = page.render({
          canvasContext: context,
          viewport,
        })

        await renderTask.promise
      } catch (error) {
        if (
          error?.name !==
          'RenderingCancelledException'
        ) {
          console.error(
            'Ошибка отображения PDF:',
            error
          )
        }
      }
    }

    renderPage()

    return () => {
      cancelled = true

      if (renderTask) {
        try {
          renderTask.cancel()
        } catch {
          // ничего не делаем
        }
      }
    }
  }, [pdf, pageNumber])


  /*
    Перерисовка PDF после изменения размеров.
    Важно для Safari и поворота iPhone.
  */

  useEffect(() => {
    if (!pdf) return

    let timeoutId = null

    const handleResize = () => {
      clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        setPageNumber((current) => current)
      }, 200)
    }

    window.addEventListener(
      'resize',
      handleResize
    )

    window.addEventListener(
      'orientationchange',
      handleResize
    )

    return () => {
      clearTimeout(timeoutId)

      window.removeEventListener(
        'resize',
        handleResize
      )

      window.removeEventListener(
        'orientationchange',
        handleResize
      )
    }
  }, [pdf])


  return (
    <div
      className="presentation-modal"
      onClick={onClose}
    >
      <div
        className="presentation-window"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="presentation-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <div
          className="pdf-viewer"
          ref={viewerRef}
        >
          {loading ? (
            <div className="pdf-loading">
              Загрузка...
            </div>
          ) : (
            <canvas
              ref={canvasRef}
            />
          )}
        </div>

        {!loading &&
          pageCount > 1 && (
            <div className="pdf-controls">
              <button
                type="button"
                onClick={() =>
                  setPageNumber(
                    (current) =>
                      current <= 1
                        ? pageCount
                        : current - 1
                  )
                }
              >
                ‹
              </button>

              <span>
                {pageNumber} / {pageCount}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPageNumber(
                    (current) =>
                      current >= pageCount
                        ? 1
                        : current + 1
                  )
                }
              >
                ›
              </button>
            </div>
          )}
      </div>
    </div>
  )
}


/* =========================================================
   APP
========================================================= */

function App() {
  const [caseOpened, setCaseOpened] =
    useState(false)

  const [opening, setOpening] =
    useState(false)

  const [selectedItem, setSelectedItem] =
    useState(null)

  const [selectedPresentation, setSelectedPresentation] =
    useState(null)

  const [showPass, setShowPass] =
    useState(false)

  const [passSide, setPassSide] =
    useState('front')

  const [showBinoculars, setShowBinoculars] =
    useState(false)

  const [showFolder, setShowFolder] =
    useState(false)

  const [selectedDocument, setSelectedDocument] =
    useState(0)

  const [editMode, setEditMode] =
    useState(false)


  /* =========================================================
     ПОЗИЦИИ
  ========================================================= */

  const [positions, setPositions] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'portfolio-positions'
        )

      if (!saved) {
        return defaultPositions
      }

      try {
        const parsed =
          JSON.parse(saved)

        return {
          ...defaultPositions,
          ...parsed,
        }
      } catch {
        return defaultPositions
      }
    })


  const caseRef = useRef(null)

  const [caseSize, setCaseSize] =
    useState({
      width: 1,
      height: 1,
    })


  /* =========================================================
     РАЗМЕР КЕЙСА
  ========================================================= */

  useEffect(() => {
    if (!caseRef.current) return

    const updateSize = () => {
      if (!caseRef.current) return

      setCaseSize({
        width:
          caseRef.current.clientWidth,

        height:
          caseRef.current.clientHeight,
      })
    }

    updateSize()

    const observer =
      new ResizeObserver(updateSize)

    observer.observe(caseRef.current)

    window.addEventListener(
      'resize',
      updateSize
    )

    return () => {
      observer.disconnect()

      window.removeEventListener(
        'resize',
        updateSize
      )
    }
  }, [])


  /* =========================================================
     ПОЗИЦИИ — ИЗМЕНЕНИЕ
  ========================================================= */

  const updatePosition = (
    id,
    changes
  ) => {
    setPositions((current) => ({
      ...current,

      [id]: {
        ...current[id],
        ...changes,
      },
    }))
  }


  /* =========================================================
     СОХРАНИТЬ
  ========================================================= */

  const savePositions = () => {
    localStorage.setItem(
      'portfolio-positions',
      JSON.stringify(positions)
    )

    setEditMode(false)
  }


  /* =========================================================
     СБРОСИТЬ
  ========================================================= */

  const resetPositions = () => {
    localStorage.removeItem(
      'portfolio-positions'
    )

    setPositions(
      defaultPositions
    )
  }


  /* =========================================================
     ОТКРЫТИЕ ПРЕДМЕТА
  ========================================================= */

  const handleItemClick = (item) => {
    if (editMode) return

    /* ПРОПУСК */

    if (item.id === 'pass') {
      setSelectedPresentation(null)
      setSelectedItem(null)
      setShowFolder(false)
      setShowBinoculars(false)

      setPassSide('front')
      setShowPass(true)

      return
    }


    /* ПАПКА */

    if (item.id === 'folder') {
      setSelectedPresentation(null)
      setSelectedItem(null)
      setShowPass(false)
      setShowBinoculars(false)

      setSelectedDocument(0)
      setShowFolder(true)

      return
    }


    /* БИНОКЛЬ */

    if (item.id === 'binoculars') {
      setSelectedPresentation(null)
      setSelectedItem(null)
      setShowPass(false)
      setShowFolder(false)

      setShowBinoculars(true)

      return
    }


    /* PDF */

    if (item.presentation) {
      setSelectedItem(null)
      setShowPass(false)
      setShowFolder(false)
      setShowBinoculars(false)

      setSelectedPresentation(
        item.presentation
      )

      return
    }


    /* ОБЫЧНЫЙ ITEM */

    setSelectedPresentation(null)
    setShowPass(false)
    setShowFolder(false)
    setShowBinoculars(false)

    setSelectedItem(item)
  }


  return (
    <main className="portfolio">

      <div className="background" />


      {/* =====================================================
         ЗАКРЫТЫЙ КЕЙС
      ===================================================== */}

      {!caseOpened && (
        <div className="closed-case-screen">

          <div className="closed-case">
            <img
              src={`${A}/case/case-closed.png`}
              alt=""
            />
          </div>

          <button
            className="open-button"
            onClick={() => {
              setOpening(true)

              setTimeout(() => {
                setCaseOpened(true)
                setOpening(false)
              }, 1600)
            }}
          >
            ОТКРЫТЬ
          </button>

          <div
            className={`opening-overlay ${
              opening ? 'active' : ''
            }`}
          />
        </div>
      )}


      {/* =====================================================
         EDIT
      ===================================================== */}

      <button
        className={`edit-button ${
          editMode ? 'active' : ''
        }`}
        onClick={() =>
          setEditMode(
            (value) => !value
          )
        }
      >
        {editMode
          ? 'EXIT EDIT'
          : 'EDIT'}
      </button>


      {editMode && (
        <div className="edit-panel">

          <button
            onClick={savePositions}
          >
            SAVE
          </button>

          <button
            onClick={resetPositions}
          >
            RESET
          </button>

        </div>
      )}


      {/* =====================================================
         КЕЙС
      ===================================================== */}

      <section
        className="case-wrapper"
        ref={caseRef}
      >

        <img
          src={`${A}/case/case-empty.png`}
          className="case"
          alt=""
        />


        <div className="items">

          {items.map((item) => {

            const position =
              positions[item.id]

            if (!position) {
              return null
            }

            const width =
              (position.width / 100) *
              caseSize.width

            const x =
              (position.x / 100) *
              caseSize.width

            const y =
              (position.y / 100) *
              caseSize.height


            const zIndex =
              item.id === 'pass'
                ? 100
                : item.id === 'binoculars'
                  ? 6
                  : 5


            return (
              <Rnd
                key={item.id}

                bounds="parent"

                position={{
                  x,
                  y,
                }}

                size={{
                  width,
                  height: 'auto',
                }}

                minWidth={20}

                enableResizing={
                  editMode
                    ? {
                        top: false,
                        right: true,
                        bottom: true,
                        left: false,
                        topRight: true,
                        bottomRight: true,
                        bottomLeft: true,
                        topLeft: true,
                      }
                    : false
                }

                disableDragging={
                  !editMode
                }

                lockAspectRatio={true}

                onDragStart={(event) => {
                  event.stopPropagation()
                }}

                onDragStop={(
                  event,
                  data
                ) => {
                  const newX =
                    (data.x /
                      caseSize.width) *
                    100

                  const newY =
                    (data.y /
                      caseSize.height) *
                    100

                  updatePosition(
                    item.id,
                    {
                      x: newX,
                      y: newY,
                    }
                  )
                }}

                onResizeStop={(
                  event,
                  direction,
                  ref,
                  delta,
                  positionData
                ) => {

                  const newWidth =
                    (ref.offsetWidth /
                      caseSize.width) *
                    100

                  const newX =
                    (positionData.x /
                      caseSize.width) *
                    100

                  const newY =
                    (positionData.y /
                      caseSize.height) *
                    100

                  updatePosition(
                    item.id,
                    {
                      width: newWidth,
                      x: newX,
                      y: newY,
                    }
                  )
                }}

                style={{
                  zIndex,
                  position:
                    'absolute',
                }}
              >

                {/* =================================================
                   TRANSFORM
                ================================================= */}

                <div
                  className="transform-layer"
                  style={{
                    width: '100%',
                    height: '100%',

                    transformOrigin:
                      'center center',

                    transform: `
                      perspective(700px)
                      rotateX(${position.perspectiveY}deg)
                      rotateY(${position.perspectiveX}deg)
                      rotateZ(${position.rotation}deg)
                    `,
                  }}
                >

                  <button
                    type="button"
                    className={`portfolio-item ${
                      editMode
                        ? 'editing'
                        : ''
                    }`}
                    onClick={() =>
                      handleItemClick(
                        item
                      )
                    }
                    aria-label={
                      item.title
                    }
                  >

                    <img
                      src={item.image}
                      alt=""
                    />

                  </button>

                </div>


                {/* =================================================
                   EDIT CONTROLS
                ================================================= */}

                {editMode && (
                  <div className="transform-controls">

                    <div className="transform-title">
                      {item.title}
                    </div>


                    <label>
                      ROTATE

                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={
                          position.rotation
                        }
                        onChange={(
                          event
                        ) => {
                          updatePosition(
                            item.id,
                            {
                              rotation:
                                Number(
                                  event.target.value
                                ),
                            }
                          )
                        }}
                      />

                      <span>
                        {
                          position.rotation
                        }
                        °
                      </span>

                    </label>


                    <label>
                      PERSPECTIVE X

                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={
                          position.perspectiveX
                        }
                        onChange={(
                          event
                        ) => {
                          updatePosition(
                            item.id,
                            {
                              perspectiveX:
                                Number(
                                  event.target.value
                                ),
                            }
                          )
                        }}
                      />

                      <span>
                        {
                          position.perspectiveX
                        }
                        °
                      </span>

                    </label>


                    <label>
                      PERSPECTIVE Y

                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={
                          position.perspectiveY
                        }
                        onChange={(
                          event
                        ) => {
                          updatePosition(
                            item.id,
                            {
                              perspectiveY:
                                Number(
                                  event.target.value
                                ),
                            }
                          )
                        }}
                      />

                      <span>
                        {
                          position.perspectiveY
                        }
                        °
                      </span>

                    </label>

                  </div>
                )}

              </Rnd>
            )
          })}

        </div>

      </section>


      {/* =====================================================
         ОБЫЧНОЕ ОКНО
      ===================================================== */}

      {selectedItem && (
        <div
          className="modal"
          onClick={() =>
            setSelectedItem(null)
          }
        >

          <div
            className="modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="close"
              onClick={() =>
                setSelectedItem(null)
              }
            >
              ×
            </button>

            <h2>
              {selectedItem.title}
            </h2>

            <p>
              {
                selectedItem.description
              }
            </p>

            <button
              type="button"
              className="open-case"
            >
              Открыть кейс
            </button>

          </div>

        </div>
      )}


      {/* =====================================================
         PDF
      ===================================================== */}

      {selectedPresentation && (
        <PDFViewer
          src={
            selectedPresentation
          }
          onClose={() =>
            setSelectedPresentation(
              null
            )
          }
        />
      )}


      {/* =====================================================
         ПРОПУСК
      ===================================================== */}

      {showPass && (
        <div
          className="pass-modal"
          onClick={() =>
            setShowPass(false)
          }
        >

          <div
            className="pass-window"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="pass-close"
              onClick={() =>
                setShowPass(false)
              }
              aria-label="Закрыть"
            >
              ×
            </button>


            <img
              src={
                passSide === 'front'
                  ? `${A}/pass/pass-front.png`
                  : `${A}/pass/pass-back.png`
              }
              className="pass-large"
              alt="Пропуск"
            />


            <button
              type="button"
              className="pass-flip"
              onClick={() => {
                setPassSide(
                  (side) =>
                    side === 'front'
                      ? 'back'
                      : 'front'
                )
              }}
            >
              ПЕРЕВЕРНУТЬ
            </button>

          </div>

        </div>
      )}


      {/* =====================================================
         ПАПКА
      ===================================================== */}

      {showFolder && (
        <div
          className="folder-modal"
          onClick={() =>
            setShowFolder(false)
          }
        >

          <div
            className="folder-window"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="folder-close"
              onClick={() =>
                setShowFolder(false)
              }
            >
              ×
            </button>


            <img
              src={`${A}/folder/folder-open.png`}
              className="folder-open-image"
              alt=""
            />


            <div className="document-viewer">

              <button
                type="button"
                className="document-arrow document-arrow-left"
                onClick={() => {
                  setSelectedDocument(
                    (current) =>
                      current === 0
                        ? 5
                        : current - 1
                  )
                }}
              >
                ‹
              </button>


              <img
                src={`${A}/folder/documents/document-${
                  String(
                    selectedDocument + 1
                  ).padStart(2, '0')
                }.png`}
                className="document-main"
                alt={`Документ ${
                  selectedDocument + 1
                }`}
              />


              <button
                type="button"
                className="document-arrow document-arrow-right"
                onClick={() => {
                  setSelectedDocument(
                    (current) =>
                      current === 5
                        ? 0
                        : current + 1
                  )
                }}
              >
                ›
              </button>

            </div>


            <div className="documents-gallery">

              {[
                'document-01.png',
                'document-02.png',
                'document-03.png',
                'document-04.png',
                'document-05.png',
                'document-06.png',
              ].map(
                (
                  document
                ) => {

                  const index =
                    Number(
                      document.match(
                        /\d+/
                      )?.[0]
                    ) - 1

                  return (
                    <button
                      type="button"
                      key={document}
                      className={`document-thumbnail ${
                        selectedDocument ===
                        index
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setSelectedDocument(
                          index
                        )
                      }
                    >

                      <img
                        src={`${A}/folder/documents/${document}`}
                        alt=""
                      />

                    </button>
                  )
                }
              )}

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
         БИНОКЛЬ
      ===================================================== */}

      {showBinoculars && (
        <div
          className="binocular-modal"
          onClick={() =>
            setShowBinoculars(
              false
            )
          }
        >

          <div
            className="binocular-window"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="binocular-close"
              onClick={() =>
                setShowBinoculars(
                  false
                )
              }
            >
              ×
            </button>


            <div className="binocular-image-wrapper">

              <img
                src={`${A}/binoculars/binocular-view.png`}
                className="binocular-view-image"
                alt="Яндекс Маркет"
              />


              {/* ДАЧА */}

              <button
                type="button"
                className="binocular-hotspot binocular-hotspot-dacha"
                onClick={() => {
                  setShowBinoculars(
                    false
                  )

                  setSelectedPresentation(
                    `${A}/presentations/yandex-market/dacha.pdf`
                  )
                }}
              >
                БРИФ «ДАЧА»
              </button>


              {/* ХАЙКИНГ */}

              <button
                type="button"
                className="binocular-hotspot binocular-hotspot-hiking"
                onClick={() => {
                  setShowBinoculars(
                    false
                  )

                  setSelectedPresentation(
                    `${A}/presentations/yandex-market/hiking.pdf`
                  )
                }}
              >
                БРИФ «ХАЙКИНГ»
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}

export default App