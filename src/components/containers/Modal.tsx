import { CSSProperties, ReactNode, useEffect, useMemo } from 'react';
import { merge } from 'lodash';
import useDimensions from 'react-cool-dimensions';
import { Modal as ResponsiveModal } from 'react-responsive-modal';
// import 'react-responsive-modal/styles.css';

// Components
import { H3 } from '../typography';
import { CloseCircle } from '../icons';

// Definitions
import colors, { blue, gray } from '../../definitions/colors';
import { UITheme } from '../theming/types';

// Hooks
import useUITheme from '../theming/useUITheme';

type ModalStyleSpec = {
  border: {
    color: CSSProperties['borderColor'];
    width: number;
    radius: CSSProperties['borderRadius'];
    style: CSSProperties['borderStyle'];
  };
  header: {
    primaryBackgroundColor: CSSProperties['backgroundColor'];
    secondaryBackgroundColor: CSSProperties['backgroundColor'];
  };
  content: {
    // TODO: It would be better to fully support all valid values.
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
  };
  size: {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
  };
};

export type ModalProps = {
  /** Adds a title to the modal. */
  title?: string;
  /** Indicates which theme role to use for style augmentation. */
  themeRole?: keyof UITheme['palette'];
  /**
   * Whether or not to include a default close button in the top
   * right corner of the modal? Defaults to false.
   * */
  includeCloseButton?: boolean;
  /**
   * Optional. If you want the modal to be able to control it's own visibility,
   * you need to pass this prop to it. The prop must be a function that accepts
   * a boolean value and modifies the value being passed into the modal as
   * the `visible` prop.
   */
  toggleVisible?: (visible: boolean) => void;
  /** Controls the visibility of the modal. */
  visible: boolean;
  /** Allows you to adjust the style of the modal. Applied *after* theming augmentation. */
  styleOverrides?: Partial<ModalStyleSpec>;
  /** The contents of the modal.  */
  children: ReactNode;
};

export default function Modal({
  title,
  visible,
  toggleVisible,
  includeCloseButton = false,
  themeRole,
  styleOverrides = {},
  children,
}: ModalProps) {
  const theme = useUITheme();

  // Track the height of the title text.
  const { observe, height: titleHeight } = useDimensions();

  // Track the height of the modal content.
  const { observe: observeModalContent, height: modalContentHeight } =
    useDimensions();

  const componentStyle: ModalStyleSpec = useMemo(() => {
    const defaultStyle: ModalStyleSpec = {
      border: {
        width: 2,
        style: 'solid',
        color: gray[500],
        radius: 7,
      },
      content: {
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
      },
      header: {
        primaryBackgroundColor: blue[500],
        secondaryBackgroundColor: blue[600],
      },
      size: {
        width: undefined,
        height: undefined,
      },
    };

    // TODO: Handle color problems when level is too dark.
    const themeStyle: Partial<ModalStyleSpec> =
      theme && themeRole
        ? {
            header: {
              primaryBackgroundColor:
                theme.palette[themeRole].hue[theme.palette.primary.level],
              secondaryBackgroundColor:
                theme.palette[themeRole].hue[theme.palette.primary.level + 100],
            },
          }
        : {};

    return merge({}, defaultStyle, themeStyle, styleOverrides);
  }, [themeRole, styleOverrides, theme]);

  return (
    <ResponsiveModal
      ref={observeModalContent}
      open={visible}
      onClose={() => toggleVisible && toggleVisible(false)}
      showCloseIcon={false}
      closeOnEsc={true}
      styles={{
        root: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: visible ? 'all' : 'none',
        },
        overlay: {
          backgroundColor: gray[700] + '80',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: visible ? 'initial' : 'none',
        },
        modalContainer: {
          position: 'absolute',
          ...(componentStyle.size.width
            ? {
                width: componentStyle.size.width,
                height: componentStyle.size.height,
              }
            : { top: 75, right: 75, bottom: 75, left: 75 }),

          background: colors.white,
          borderRadius: componentStyle.border.radius,
          outlineColor: componentStyle.border.color,
          outlineWidth: componentStyle.border.width,
          outlineStyle: componentStyle.border.style,
          outlineOffset: -1 * componentStyle.border.width + 1,
          overflow: 'hidden',
          display: visible ? 'initial' : 'none',
        },
        modal: {
          width: '100%',
          height: '100%',
        },
      }}
    >
      <div ref={observeModalContent}>
        {title && (
          <div
            css={{
              height: titleHeight + 39,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              css={{
                flex: 1,
                backgroundColor: componentStyle.header.primaryBackgroundColor,
                transition: 'all ease .25s',
              }}
            />
            <div
              css={{
                flexBasis: 15,
                backgroundColor: componentStyle.header.secondaryBackgroundColor,
                transition: 'all ease .25s',
              }}
            />
            <div css={{ position: 'absolute', left: 25, top: 34 }}>
              <H3
                ref={observe}
                text={title}
                color='white'
                additionalStyles={{ margin: 0, paddingRight: 25 }}
                useTheme={false}
              />
            </div>
          </div>
        )}
        {includeCloseButton && toggleVisible && (
          <CloseCircle
            fill={title ? 'white' : gray[600]}
            css={{ position: 'absolute', top: 15, right: 15 }}
            fontSize={24}
            onClick={() => toggleVisible(!visible)}
            role='button'
            aria-label='Close modal button.'
          />
        )}
        <div
          css={{
            height: modalContentHeight - (title ? titleHeight + 39 : 0),
            overflowY: 'auto',
          }}
        >
          <div
            css={{
              paddingTop: componentStyle.content.paddingTop,
              paddingRight: componentStyle.content.paddingRight,
              paddingBottom: componentStyle.content.paddingBottom,
              paddingLeft: componentStyle.content.paddingLeft,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
