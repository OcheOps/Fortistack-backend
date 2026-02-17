package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// S3Storage stores objects via the S3 API.
// Works with AWS S3, Ceph RGW, and MinIO.
type S3Storage struct {
	client *s3.Client
	bucket string
}

// S3Config holds all config needed for an S3-compatible backend.
type S3Config struct {
	Endpoint       string
	AccessKey      string
	SecretKey      string
	Bucket         string
	Region         string
	ForcePathStyle bool
	DisableSSL     bool
}

func NewS3Storage(ctx context.Context, cfg S3Config) (*S3Storage, error) {
	resolver := aws.EndpointResolverWithOptionsFunc(
		func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			if cfg.Endpoint != "" {
				scheme := "https"
				if cfg.DisableSSL {
					scheme = "http"
				}
				// If endpoint already has scheme, use as-is
				ep := cfg.Endpoint
				if ep[0:4] != "http" {
					ep = scheme + "://" + ep
				}
				return aws.Endpoint{
					URL:               ep,
					HostnameImmutable: cfg.ForcePathStyle,
				}, nil
			}
			return aws.Endpoint{}, &aws.EndpointNotFoundError{}
		},
	)

	awsCfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, ""),
		),
		config.WithEndpointResolverWithOptions(resolver),
	)
	if err != nil {
		return nil, fmt.Errorf("s3 storage: failed to load config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.ForcePathStyle
	})

	slog.Info("S3 storage initialized",
		"endpoint", cfg.Endpoint,
		"bucket", cfg.Bucket,
		"region", cfg.Region,
	)

	return &S3Storage{client: client, bucket: cfg.Bucket}, nil
}

func (s *S3Storage) Put(ctx context.Context, key, contentType string, body io.Reader) error {
	// Read body into bytes for Content-Length (required by some S3-compat stores)
	data, err := io.ReadAll(body)
	if err != nil {
		return fmt.Errorf("s3 storage: failed to read body: %w", err)
	}

	input := &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String(contentType),
	}

	_, err = s.client.PutObject(ctx, input)
	if err != nil {
		return fmt.Errorf("s3 storage: PutObject failed for key %s: %w", key, err)
	}

	slog.Info("S3 object stored", "key", key, "size", len(data))
	return nil
}

func (s *S3Storage) Get(ctx context.Context, key string) (io.ReadCloser, string, error) {
	input := &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}

	result, err := s.client.GetObject(ctx, input)
	if err != nil {
		return nil, "", fmt.Errorf("s3 storage: GetObject failed for key %s: %w", key, err)
	}

	ct := "application/octet-stream"
	if result.ContentType != nil {
		ct = *result.ContentType
	}

	return result.Body, ct, nil
}

func (s *S3Storage) Delete(ctx context.Context, key string) error {
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}

	_, err := s.client.DeleteObject(ctx, input)
	if err != nil {
		return fmt.Errorf("s3 storage: DeleteObject failed for key %s: %w", key, err)
	}
	return nil
}

// EnsureBucket creates the bucket if it doesn't exist.
func (s *S3Storage) EnsureBucket(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})
	if err == nil {
		return nil // bucket exists
	}

	_, err = s.client.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket: aws.String(s.bucket),
	})
	if err != nil {
		return fmt.Errorf("s3 storage: CreateBucket failed: %w", err)
	}

	slog.Info("S3 bucket created", "bucket", s.bucket)
	return nil
}

// ContentTypeFromExt is a helper.
func ContentTypeFromExt(key string) string {
	ext := filepath.Ext(key)
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".json":
		return "application/json"
	case ".html":
		return "text/html"
	default:
		return "application/octet-stream"
	}
}
