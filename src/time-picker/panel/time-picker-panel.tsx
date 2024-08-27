import {
  defineComponent, computed, ref, onMounted, nextTick, watch,
} from '@vue/composition-api';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { TimePickerValue } from '../type';
import { DEFAULT_STEPS, DEFAULT_FORMAT } from '../../_common/js/time-picker/const';
import { panelProps } from './props';
import SinglePanel from './single-panel';
import TButton from '../../button/button';
import { useConfig, usePrefixClass } from '../../hooks/useConfig';
import log from '../../_common/js/log';

dayjs.extend(customParseFormat);

export default defineComponent({
  name: 'TTimePickerPanel',
  props: {
    ...panelProps(),
    handleConfirmClick: Function,
    onChange: Function,
    onPick: Function,
    disableTime: Function,
  },
  setup(props, ctx) {
    const panelClassName = usePrefixClass('time-picker__panel');
    const triggerScroll = ref(false);
    const { global } = useConfig('timePicker');
    const showNowTimeBtn = computed(() => !!props.steps.filter((v: number) => v > 1).length);
    const defaultValue = computed(() => {
      const isStepsSet = showNowTimeBtn.value;
      const formattedValue = dayjs(props.value, props.format);
      if (props.value && formattedValue.isValid()) {
        return formattedValue;
      }
      if (isStepsSet) {
        return dayjs().hour(0).minute(0).second(0);
      }
      return dayjs().hour(0).minute(0).second(0)
        .format(props.format);
    });

    const panelColUpdate = () => {
      nextTick(() => {
        triggerScroll.value = true;
      });
    };

    const resetTriggerScroll = () => {
      triggerScroll.value = false;
    };

    const handleChange = (v: string, e: MouseEvent) => {
      // 触发onPick事件
      props.onPick?.(v, e);
      ctx.emit('pick', v, e); // 处理直接使用panel的场景 支持@/v-on语法

      props.onChange?.(v);
      ctx.emit('change', v); // 处理直接使用panel的场景 支持@/v-on语法
    };
    const handlePresetClick = (presetValue: TimePickerValue | (() => TimePickerValue)) => {
      const presetVal = typeof presetValue === 'function' ? presetValue() : presetValue;
      if (typeof props.activeIndex === 'number') {
        if (Array.isArray(presetVal)) {
          props.onChange(presetVal[props.activeIndex]);
        } else {
          log.error('TimePicker', `preset: ${props.presets} 预设值必须是数组!`);
        }
      } else {
        props.onChange(presetVal);
      }
    };
    // 渲染后执行update 使面板滚动至当前时间位置
    onMounted(() => {
      panelColUpdate();
    });

    watch(
      () => props.isShowPanel,
      () => {
        panelColUpdate();
      },
    );

    return {
      showNowTimeBtn,
      panelClassName,
      triggerScroll,
      resetTriggerScroll,
      defaultValue,
      global,
      handleChange,
      handlePresetClick,
    };
  },

  render() {
    return (
      <div class={this.panelClassName}>
        <div class={`${this.panelClassName}-section-body`}>
          <SinglePanel
            {...{
              props: {
                value: dayjs(this.value, this.format).isValid() ? this.value : this.defaultValue,
                onChange: this.handleChange,
                onPick: this.onPick,
                format: this.format || DEFAULT_FORMAT,
                steps: this.steps || DEFAULT_STEPS,
                triggerScroll: this.triggerScroll,
                disableTime: this.disableTime,
                position: this.position,
                resetTriggerScroll: this.resetTriggerScroll,
                isShowPanel: this.isShowPanel,
                hideDisabledTime: this.hideDisabledTime,
              },
            }}
          />
        </div>
        {this.isFooterDisplay ? (
          <div class={`${this.panelClassName}-section-footer`}>
            <TButton
              theme="primary"
              variant="base"
              disabled={!this.value}
              onClick={() => this.handleConfirmClick(this.defaultValue)}
              size="small"
            >
              {this.global.confirm}
            </TButton>
            <div>
              {!this.showNowTimeBtn ? (
                <TButton
                  theme="primary"
                  variant="text"
                  size="small"
                  onClick={() => this.onChange(dayjs().format(this.format))}
                >
                  {this.global.now}
                </TButton>
              ) : null}
              {this.presets
                && Object.keys(this.presets).map((key: string) => (
                  <TButton
                    key={key}
                    theme="primary"
                    size="small"
                    variant="text"
                    onClick={() => this.handlePresetClick?.(this.presets[key])}
                  >
                    {key}
                  </TButton>
                ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
});
