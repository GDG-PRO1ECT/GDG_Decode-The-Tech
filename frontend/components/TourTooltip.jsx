import React, { forwardRef } from 'react';

const TourTooltip = forwardRef(({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  skipProps,
  primaryProps,
  tooltipProps,
  isLastStep,
}, ref) => {
  return (
    <div
      {...tooltipProps}
      ref={ref}
      className={`bg-[#202124] text-white rounded-xl shadow-2xl overflow-hidden font-sans border border-white/10 max-w-sm w-full ${tooltipProps?.className || ''}`}
      style={{
        ...(tooltipProps?.style || {}),
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(66, 133, 244, 0.1)',
      }}
    >
      <div className="p-6">
        {/* Step Indicator (Optional, but looks good in multi-step) */}
        {continuous && step.title && (
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-100">{step.title}</h4>
            <span className="text-xs font-medium bg-[#303134] text-gray-300 px-2 py-1 rounded-full">
              {index + 1}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="text-sm text-gray-300 leading-relaxed">
          {step.content}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-4 bg-[#28292c] flex items-center justify-between border-t border-white/5">
        <button
          {...(skipProps || closeProps)}
          className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Skip
        </button>

        <div className="flex items-center gap-3">
          {index > 0 && (
            <button
              {...backProps}
              className="text-sm font-medium text-[#8ab4f8] hover:text-[#aecbfa] transition-colors"
            >
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-1.5 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] text-sm font-bold transition-all shadow-[0_0_10px_rgba(138,180,248,0.2)]"
          >
            {isLastStep ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default TourTooltip;
