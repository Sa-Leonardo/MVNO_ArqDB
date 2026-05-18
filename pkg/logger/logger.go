package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"log"
)

var Log *zap.Logger

func Init(env string) {
	var err error

	if env == "production" {
		Log, err = zap.NewProduction()
	} else {
		config := zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		Log, err = config.Build()
	}

	if err != nil {
		log.Fatalf("erro ao inicializar logger: %v", err)
	}
}

func Sync() {
	if Log != nil {
		_ = Log.Sync()
	}
}